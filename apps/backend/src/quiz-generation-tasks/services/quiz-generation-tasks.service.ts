import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import {
  Question,
  Answer,
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { OpenAILLMService } from './openai-llm.service';

@Injectable()
export class QuizGenerationTasksService {
  private readonly logger = new Logger(QuizGenerationTasksService.name);

  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly dataSource: DataSource,
    private readonly openAILLMService: OpenAILLMService,
  ) {}

  /**
   * Creates a new quiz generation task with the given text and generates questions
   * @param createQuizGenerationTaskDto - The DTO containing text to generate questions from
   * @returns A confirmation object with task details
   */
  async createTask(createQuizGenerationTaskDto: CreateQuizGenerationTaskDto) {
    const { text, userId } = createQuizGenerationTaskDto;

    try {
      // Create a new quiz generation task
      const quizGenerationTask = new QuizGenerationTask({
        textContent: text,
        questions: [],
        status: QuizGenerationStatus.IN_PROGRESS,
      });

      const taskId = quizGenerationTask.getId();
      this.logger.log(
        `Creating quiz generation task ${taskId} for user ${userId}`,
      );
      this.logger.debug(`Text length: ${text.length} characters`);

      // Generate questions from the text
      const questionAnswerPairs = await this.generateQuestionsFromText(text);

      // Save everything in a transaction and get the created questions
      const questions =
        await this.saveQuestionsAndAnswersInTransaction(questionAnswerPairs);

      // Add questions to the task and update status
      questions.forEach((question) => quizGenerationTask.addQuestion(question));
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);

      this.logger.log(
        `Successfully generated ${questions.length} questions for task ${taskId}`,
      );

      return {
        taskId,
        userId,
        status: quizGenerationTask.getStatus(),
        questionsCount: questions.length,
        message: `Quiz generation task created with ${questions.length} questions`,
        generatedAt: quizGenerationTask.getGeneratedAt(),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create quiz generation task: ${error.message}`,
          error.stack,
        );
      }

      throw error;
    }
  }

  /**
   * Generates questions from the provided text using OpenAI
   * @param text - The text to generate questions from
   * @returns An array of question-answer pairs
   */
  private async generateQuestionsFromText(text: string): Promise<
    Array<{
      question: string;
      answers: Array<{ content: string; isCorrect: boolean }>;
    }>
  > {
    this.logger.debug(`Generating questions from text using OpenAI`);

    try {
      // Use the OpenAI LLM service to generate questions
      const generatedQuizQuestions =
        await this.openAILLMService.generateQuiz(text);

      // Map the OpenAI response format to our internal format
      return generatedQuizQuestions.map((quizQuestion) => ({
        question: quizQuestion.question,
        answers: quizQuestion.answers.map((answer) => ({
          content: answer.text,
          isCorrect: answer.isCorrect,
        })),
      }));
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to generate questions with OpenAI: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Saves generated questions and their corresponding answers to the database in a single transaction
   * @param questionAnswerPairs - Array of question-answer pairs
   * @returns Array of created Question domain entities
   */
  private async saveQuestionsAndAnswersInTransaction(
    questionAnswerPairs: Array<{
      question: string;
      answers: Array<{ content: string; isCorrect: boolean }>;
    }>,
  ): Promise<Question[]> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const questions: Question[] = [];
      const allAnswers: Answer[] = [];

      // Create domain entities for questions and answers
      for (const pair of questionAnswerPairs) {
        // Create the question with auto-generated ID
        const question = new Question({
          content: pair.question,
          answers: [], // Will be populated after saving
        });

        const questionId = question.getId();
        questions.push(question);

        // Create the answers for this question
        const answers = pair.answers.map(
          (answer) =>
            new Answer({
              content: answer.content,
              isCorrect: answer.isCorrect,
              questionId: questionId,
            }),
        );

        allAnswers.push(...answers);
      }

      // Save questions and answers using the transaction's entity manager
      await this.questionRepository.saveQuestions(
        questions,
        queryRunner.manager,
      );
      await this.answerRepository.saveAnswers(allAnswers, queryRunner.manager);

      // Commit the transaction
      await queryRunner.commitTransaction();
      return questions;
    } catch (error) {
      // This will properly roll back ALL changes made with queryRunner.manager
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
