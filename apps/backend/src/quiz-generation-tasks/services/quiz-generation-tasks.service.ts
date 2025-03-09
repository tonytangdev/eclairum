import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
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
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { QuizQuestion } from '@flash-me/core/interfaces';

// New type definitions to replace any usages
interface QuestionAnswerPair {
  question: string;
  answers: AnswerData[];
}

interface AnswerData {
  content: string;
  isCorrect: boolean;
}

export interface TaskResponse {
  taskId: string;
  userId: string;
  status: QuizGenerationStatus;
  questionsCount: number;
  message: string;
  generatedAt: Date;
}

@Injectable()
export class QuizGenerationTasksService {
  private readonly logger = new Logger(QuizGenerationTasksService.name);

  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly dataSource: DataSource,
    private readonly openAILLMService: OpenAILLMService,
  ) {}

  async createTask(
    createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    const { text, userId } = createQuizGenerationTaskDto;

    try {
      const quizGenerationTask = this.initializeTask(text);
      const taskId = quizGenerationTask.getId();

      this.logTaskCreation(taskId, userId, text);
      return await this.executeTaskCreationTransaction(
        quizGenerationTask,
        text,
        userId,
      );
    } catch (error) {
      this.logError('Failed to create quiz generation task', error);
      throw error;
    }
  }

  async getTaskById(taskId: string): Promise<QuizGenerationTask | null> {
    return this.quizGenerationTaskRepository.findById(taskId);
  }

  private initializeTask(text: string): QuizGenerationTask {
    return new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
    });
  }

  private logTaskCreation(taskId: string, userId: string, text: string): void {
    this.logger.log(
      `Creating quiz generation task ${taskId} for user ${userId}`,
    );
    this.logger.debug(`Text length: ${text.length} characters`);
  }

  private async executeTaskCreationTransaction(
    quizGenerationTask: QuizGenerationTask,
    text: string,
    userId: string,
  ): Promise<TaskResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      return await this.processTaskWithinTransaction(
        quizGenerationTask,
        text,
        userId,
        queryRunner.manager,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async processTaskWithinTransaction(
    quizGenerationTask: QuizGenerationTask,
    text: string,
    userId: string,
    entityManager: EntityManager,
  ): Promise<TaskResponse> {
    await this.saveInitialTask(quizGenerationTask, entityManager);

    const questions = await this.generateAndSaveQuestions(text, entityManager);

    await this.finalizeTask(quizGenerationTask, questions, entityManager);

    return this.createTaskResponse(quizGenerationTask, userId);
  }

  private async saveInitialTask(
    task: QuizGenerationTask,
    entityManager: EntityManager,
  ): Promise<void> {
    await this.quizGenerationTaskRepository.save(task, entityManager);
  }

  private async generateAndSaveQuestions(
    text: string,
    entityManager: EntityManager,
  ): Promise<Question[]> {
    const questionAnswerPairs = await this.generateQuestionsFromText(text);
    return this.saveQuestionsAndAnswersInTransaction(
      questionAnswerPairs,
      entityManager,
    );
  }

  private async finalizeTask(
    task: QuizGenerationTask,
    questions: Question[],
    entityManager: EntityManager,
  ): Promise<void> {
    this.addQuestionsToTask(task, questions);
    task.updateStatus(QuizGenerationStatus.COMPLETED);
    await this.quizGenerationTaskRepository.save(task, entityManager);
  }

  private addQuestionsToTask(
    task: QuizGenerationTask,
    questions: Question[],
  ): void {
    questions.forEach((question) => task.addQuestion(question));
  }

  private createTaskResponse(
    task: QuizGenerationTask,
    userId: string,
  ): TaskResponse {
    const taskId = task.getId();
    const questionsCount = task.getQuestions().length;

    this.logger.log(
      `Successfully generated ${questionsCount} questions for task ${taskId}`,
    );

    return {
      taskId,
      userId,
      status: task.getStatus(),
      questionsCount,
      message: `Quiz generation task created with ${questionsCount} questions`,
      generatedAt: task.getGeneratedAt()!,
    };
  }

  private async generateQuestionsFromText(
    text: string,
  ): Promise<QuestionAnswerPair[]> {
    this.logger.debug(`Generating questions from text using OpenAI`);

    try {
      return await this.fetchAndFormatQuestions(text);
    } catch (error) {
      this.logError('Failed to generate questions with OpenAI', error);
      throw error;
    }
  }

  private async fetchAndFormatQuestions(
    text: string,
  ): Promise<QuestionAnswerPair[]> {
    const generatedQuizQuestions =
      await this.openAILLMService.generateQuiz(text);
    return this.formatQuizQuestions(generatedQuizQuestions);
  }

  private formatQuizQuestions(
    quizQuestions: QuizQuestion[],
  ): QuestionAnswerPair[] {
    return quizQuestions.map((quizQuestion: QuizQuestion) => ({
      question: quizQuestion.question,
      answers: this.formatAnswers(quizQuestion.answers),
    }));
  }

  private formatAnswers(answers: QuizQuestion['answers']): AnswerData[] {
    return answers.map((answer) => ({
      content: answer.text,
      isCorrect: answer.isCorrect,
    }));
  }

  private async saveQuestionsAndAnswersInTransaction(
    questionAnswerPairs: QuestionAnswerPair[],
    entityManager?: EntityManager,
  ): Promise<Question[]> {
    const questions = this.createQuestionEntities(questionAnswerPairs);
    const allAnswers = this.extractAllAnswers(questions);

    await this.persistEntities(questions, allAnswers, entityManager);

    return questions;
  }

  private createQuestionEntities(
    questionAnswerPairs: QuestionAnswerPair[],
  ): Question[] {
    return questionAnswerPairs.map((pair) => {
      const question = new Question({
        content: pair.question,
        answers: [],
      });

      const answers = this.createAnswersForQuestion(
        question.getId(),
        pair.answers,
      );
      answers.forEach((answer) => question.addAnswer(answer));
      return question;
    });
  }

  private createAnswersForQuestion(
    questionId: string,
    answerData: AnswerData[],
  ): Answer[] {
    return answerData.map(
      (answer) =>
        new Answer({
          content: answer.content,
          isCorrect: answer.isCorrect,
          questionId,
        }),
    );
  }

  private extractAllAnswers(questions: Question[]): Answer[] {
    return questions.flatMap((question) => question.getAnswers());
  }

  private async persistEntities(
    questions: Question[],
    answers: Answer[],
    entityManager?: EntityManager,
  ): Promise<void> {
    await this.questionRepository.saveQuestions(questions, entityManager);
    await this.answerRepository.saveAnswers(answers, entityManager);
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    } else {
      this.logger.error(`${message}: Unknown error`);
    }
  }
}
