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
import { RequiredTextContentError } from "../errors/validation-errors";
import { User, File } from "../entities";
import { MAX_TEXT_LENGTH } from "../constants/quiz";
import { QuizGeneratorService } from "../services/quiz-generator.service";
import { QuizStorageService } from "../services/quiz-storage.service";
import { FileUploadService } from "../interfaces/file-upload-service.interface";
import { FileRepository } from "../interfaces/file-repository.interface";

type CreateQuizGenerationTaskUseCaseRequest = {
  userId: User["id"];
  text: string;
  isFileUpload?: boolean;
  existingTask?: QuizGenerationTask;
  bucketName?: string;
  filePath?: string;
};

type CreateQuizGenerationTaskUseCaseResponse = {
  quizGenerationTask: QuizGenerationTask;
  fileUploadUrl?: string;
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
    private readonly fileRepository?: FileRepository,
    private readonly fileUploadService?: FileUploadService,
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
    isFileUpload = false,
    existingTask,
    bucketName,
    filePath,
  }: CreateQuizGenerationTaskUseCaseRequest): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    await this.validateUser(userId);

    if (!isFileUpload) {
      this.validateText(text);
      return this.handleDirectTextProcessing(userId, text, existingTask);
    }

    return this.handleFileUpload(
      userId,
      text || "File upload task",
      bucketName,
      filePath,
    );
  }

  private validateText(text: string): void {
    if (!text?.trim()) {
      throw new RequiredTextContentError();
    }

    this.validateTextLength(text);
  }

  private async handleDirectTextProcessing(
    userId: User["id"],
    text: string,
    existingTask?: QuizGenerationTask,
  ): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    const quizGenerationTask =
      existingTask || (await this.createAndSaveTask(userId, text));

    this.processQuizGeneration(quizGenerationTask, text).catch((error) => {
      console.error(`Error during async quiz generation: ${error}`);
      console.error((error as Error).stack);
    });

    return { quizGenerationTask };
  }

  private async handleFileUpload(
    userId: User["id"],
    text: string,
    bucketName?: string,
    filePath?: string,
  ): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    this.ensureFileUploadServiceExists();

    const quizGenerationTask = await this.createAndSaveTask(userId, text);

    const file = new File({
      path: filePath || "",
      bucketName: bucketName || "",
      quizGenerationTaskId: quizGenerationTask.getId(),
    });

    await this.saveFile(file);

    const fileUploadUrl = await this.generateFileUploadUrl(
      quizGenerationTask.getId(),
    );

    return { quizGenerationTask, fileUploadUrl };
  }

  private async createAndSaveTask(
    userId: User["id"],
    text: string,
  ): Promise<QuizGenerationTask> {
    const quizGenerationTask = this.createTask(text, userId);
    await this.quizStorage.saveTask(quizGenerationTask);
    return quizGenerationTask;
  }

  private async saveFile(file: File): Promise<void> {
    this.ensureFileRepositoryExists();
    await this.fileRepository!.save(file);
  }

  private ensureFileRepositoryExists(): void {
    if (!this.fileRepository) {
      throw new Error("File repository is not configured");
    }
  }

  private ensureFileUploadServiceExists(): void {
    if (!this.fileUploadService) {
      throw new Error("File upload service is not configured");
    }
  }

  private async generateFileUploadUrl(taskId: string): Promise<string> {
    this.ensureFileUploadServiceExists();
    return this.fileUploadService!.generateUploadUrl(taskId);
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
      const { questions, title } =
        await this.quizGenerator.generateQuestionsAndTitle(
          quizGenerationTask.getId(),
          text,
        );

      this.setTitleForTask(quizGenerationTask, title);
      this.addQuestionsToTask(quizGenerationTask, questions);
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);
      await this.quizStorage.saveQuizData(quizGenerationTask, questions);
    } catch (error) {
      await this.handleFailedTask(quizGenerationTask, error);
    }
  }

  private setTitleForTask(
    quizGenerationTask: QuizGenerationTask,
    title: string,
  ): void {
    quizGenerationTask.setTitle(title);
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
