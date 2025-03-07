import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
  QuizStorageError,
} from "../errors/quiz-errors";

type CreateQuizGenerationTaskUseCaseRequest = {
  text: string;
};

type CreateQuizGenerationTaskUseCaseResponse = {
  quizGenerationTask: QuizGenerationTask;
};

export class CreateQuizGenerationTaskUseCase {
  constructor(
    private readonly llmService: LLMService,
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async execute({
    text,
  }: CreateQuizGenerationTaskUseCaseRequest): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    // Create a new quiz generation task
    const quizGenerationTask = new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
    });

    try {
      // Generate quiz questions using LLM service
      let llmQuestions: QuizQuestion[];
      try {
        llmQuestions = await this.llmService.generateQuiz(text);
      } catch (error) {
        throw new LLMServiceError(
          `Failed to generate quiz questions: ${(error as Error).message}`,
          error as Error,
        );
      }

      // Check if we have any questions
      if (!llmQuestions || llmQuestions.length === 0) {
        throw new NoQuestionsGeneratedError(text);
      }

      // Convert LLM questions to domain entities
      const questions = llmQuestions.map((llmQuestion) => {
        const question = new Question({
          content: llmQuestion.question,
          answers: [],
        });

        // Create answer entities for each answer
        const answers = llmQuestion.answers.map((llmAnswer) => {
          return new Answer({
            content: llmAnswer.text,
            isCorrect: llmAnswer.isCorrect,
            questionId: question.getId(),
          });
        });

        // Add answers to the question
        answers.forEach((answer) => {
          question.addAnswer(answer);
        });
        return question;
      });

      // Add questions to the task
      questions.forEach((question) => {
        quizGenerationTask.addQuestion(question);
      });

      // Mark the task as completed
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);

      // Save the questions and answers using repositories
      try {
        await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);
        await this.questionRepository.saveQuestions(questions);
        await this.answerRepository.saveAnswers(
          questions.flatMap((question) => question.getAnswers()),
        );
      } catch (error) {
        throw new QuizStorageError(
          `Failed to save quiz generation task: ${(error as Error).message}`,
          error as Error,
        );
      }

      return {
        quizGenerationTask,
      };
    } catch (error) {
      // If there's an error, mark the task as failed
      quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);

      // Still try to save the task with the failed status
      try {
        await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);
        await this.questionRepository.saveQuestions(
          quizGenerationTask.getQuestions(),
        );
      } catch (saveError) {
        console.error("Failed to save failed quiz generation task:", saveError);
      }

      // Re-throw the error
      throw error;
    }
  }
}
