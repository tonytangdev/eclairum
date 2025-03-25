import { OCRService } from "../interfaces/ocr-service.interface";
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
    private readonly createQuizGenerationTaskUseCase: CreateQuizGenerationTaskUseCase,
  ) {}

  async execute({
    taskId,
    userId,
  }: ResumeQuizGenerationTaskAfterUploadRequest): Promise<ResumeQuizGenerationTaskAfterUploadResponse> {
    const task = await this.getAndValidateTask(taskId, userId);

    // Start processing in background without waiting for it
    void this.processTaskInBackground(taskId, userId, task);

    return {
      success: true,
      task,
    };
  }

  private async processTaskInBackground(
    taskId: string,
    userId: string,
    task: QuizGenerationTask,
  ): Promise<void> {
    try {
      const extractedText = await this.extractText(taskId);

      console.log(`Extracted text from task ${taskId}: ${extractedText}`);
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

  private async extractText(taskId: string): Promise<string> {
    return this.ocrService.extractTextFromFile(taskId);
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
}
