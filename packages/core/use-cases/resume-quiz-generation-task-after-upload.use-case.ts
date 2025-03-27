import { OCRService } from "../interfaces/ocr-service.interface";
import { FileRepository } from "../interfaces/file-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";
import { File } from "../entities";

interface ResumeQuizGenerationTaskAfterUploadRequest {
  taskId: string;
  userId: string;
}

interface ResumeQuizGenerationTaskAfterUploadResponse {
  success: boolean;
  task: QuizGenerationTask;
}

export class ResumeQuizGenerationTaskAfterUploadUseCase {
  // 1 minute timeout
  private readonly TIMEOUT_MS = 60000;

  constructor(
    private readonly ocrService: OCRService,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
    private readonly fileRepository: FileRepository,
    private readonly createQuizGenerationTaskUseCase: CreateQuizGenerationTaskUseCase,
  ) {}

  async execute({
    taskId,
    userId,
  }: ResumeQuizGenerationTaskAfterUploadRequest): Promise<ResumeQuizGenerationTaskAfterUploadResponse> {
    const task = await this.getAndValidateTask(taskId, userId);
    const file = await this.getFile(taskId);

    // Start processing in background without waiting for it
    void this.processTaskInBackground(file.getPath(), userId, task);

    return {
      success: true,
      task,
    };
  }

  private async processTaskInBackground(
    filePath: string,
    userId: string,
    task: QuizGenerationTask,
  ): Promise<void> {
    try {
      const extractedText = await this.extractText(filePath);

      // Resume quiz generation with the extracted text
      await this.createQuizGenerationTaskUseCase.execute({
        userId,
        text: extractedText,
        existingTask: task,
      });
    } catch (error) {
      await this.handleFailedTask(task, error);
    }
  }

  private async getAndValidateTask(
    taskId: string,
    userId: string,
  ): Promise<QuizGenerationTask> {
    const task = await this.quizGenerationTaskRepository.findById(taskId);

    if (!task) {
      throw new TaskNotFoundError(`Task with ID ${taskId} not found`);
    }

    if (task.getUserId() !== userId) {
      throw new UnauthorizedTaskAccessError(
        `User ${userId} is not authorized to access task ${taskId}`,
      );
    }

    return task;
  }

  private async extractText(filePath: string): Promise<string> {
    return this.ocrService.extractTextFromFile(filePath);
  }

  private async handleFailedTask(
    task: QuizGenerationTask,
    error: unknown,
  ): Promise<void> {
    task.updateStatus(QuizGenerationStatus.FAILED);
    console.error(
      `Failed to resume task ${task.getId()} due to error: ${(error as Error).message}`,
    );

    try {
      await this.quizGenerationTaskRepository.saveTask(task);
    } catch (saveError) {
      console.error("Failed to save failed quiz generation task:", saveError);
    }
  }

  private async getFile(taskId: string): Promise<File> {
    const file = await this.fileRepository.findByQuizGenerationTaskId(taskId);
    if (!file) {
      throw new Error(`No file found for task ID: ${taskId}`);
    }
    return file;
  }
}
