import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { LLMService } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { TextTooLongError, UserNotFoundError } from "../errors/quiz-errors";
import { User } from "../entities";
import { MAX_TEXT_LENGTH } from "../constants/quiz";
import { QuizGeneratorService } from "../services/quiz-generator.service";
import { QuizStorageService } from "../services/quiz-storage.service";

type CreateQuizGenerationTaskUseCaseRequest = {
  userId: User["id"];
  text: string;
};

type CreateQuizGenerationTaskUseCaseResponse = {
  quizGenerationTask: QuizGenerationTask;
};

export class CreateQuizGenerationTaskUseCase {
  private readonly quizGenerator: QuizGeneratorService;
  private readonly quizStorage: QuizStorageService;

  constructor(
    readonly llmService: LLMService,
    readonly questionRepository: QuestionRepository,
    readonly answerRepository: AnswerRepository,
    readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
    private readonly userRepository: UserRepository,
  ) {
    this.quizGenerator = new QuizGeneratorService(llmService);
    this.quizStorage = new QuizStorageService(
      questionRepository,
      answerRepository,
      quizGenerationTaskRepository,
    );
  }

  async execute({
    userId,
    text,
  }: CreateQuizGenerationTaskUseCaseRequest): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    this.validateTextLength(text);
    await this.validateUser(userId);

    const quizGenerationTask = this.createTask(text, userId);
    await this.quizStorage.saveTask(quizGenerationTask);

    this.processQuizGeneration(quizGenerationTask, text).catch((error) => {
      console.error(`Error during async quiz generation: ${error}`);
      console.error((error as Error).stack);
    });

    return { quizGenerationTask };
  }

  private validateTextLength(text: string): void {
    if (text.length > MAX_TEXT_LENGTH) {
      throw new TextTooLongError(
        `Text exceeds the maximum length of ${MAX_TEXT_LENGTH} characters`,
      );
    }
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with ID ${userId} not found`);
    }
  }

  private createTask(text: string, userId: User["id"]): QuizGenerationTask {
    return new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
      userId,
    });
  }

  private addQuestionsToTask(
    task: QuizGenerationTask,
    questions: Question[],
  ): void {
    questions.forEach((question) => task.addQuestion(question));
  }

  private async processQuizGeneration(
    quizGenerationTask: QuizGenerationTask,
    text: string,
  ): Promise<void> {
    try {
      const questions = await this.quizGenerator.generateQuestions(
        quizGenerationTask.getId(),
        text,
      );

      this.addQuestionsToTask(quizGenerationTask, questions);
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);
      await this.quizStorage.saveQuizData(quizGenerationTask, questions);
    } catch (error) {
      await this.handleFailedTask(quizGenerationTask, error);
    }
  }

  private async handleFailedTask(
    quizGenerationTask: QuizGenerationTask,
    error: unknown,
  ): Promise<void> {
    quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);

    try {
      await this.quizStorage.saveFailedTask(quizGenerationTask);
    } catch (saveError) {
      console.error("Failed to save failed quiz generation task:", saveError);
    }

    throw error;
  }
}
