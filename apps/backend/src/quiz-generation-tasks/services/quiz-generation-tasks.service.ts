import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { FetchQuizGenerationTasksDto } from '../dto/fetch-quiz-generation-tasks.dto';
import {
  PaginatedTasksResponse,
  TaskResponse,
  TaskSummaryResponse,
} from '../dto/fetch-quiz-generation-tasks.response.dto';
import { TaskDetailResponse } from '../dto/fetch-quiz-generation-task.response.dto';
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  UserNotFoundError,
} from '@eclairum/core/errors';
import { QuizGenerationTaskMapper } from '../mappers/quiz-generation-task.mapper';
import { QuizGenerationTaskUseCaseFactory } from '../factories/quiz-generation-task-use-case.factory';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';
import { AnswerRepositoryImpl } from '../../repositories/answers/answer.repository';
import { FileUploadService, OCRService } from '@eclairum/core/interfaces';
import { FILE_UPLOAD_SERVICE_PROVIDER_KEY } from './s3-file-upload.service';
import { OCR_SERVICE_PROVIDER_KEY } from './textract-ocr.service';
import { FileRepositoryImpl } from '../../repositories/files/file.repository';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuizGenerationTasksService {
  private readonly logger = new Logger(QuizGenerationTasksService.name);
  private readonly mapper: QuizGenerationTaskMapper;
  private readonly useCaseFactory: QuizGenerationTaskUseCaseFactory;
  private readonly bucketName: string;

  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    @Inject(LLM_SERVICE_PROVIDER_KEY)
    private readonly llmService: LLMService,
    private readonly userRepository: UserRepositoryImpl,
    private readonly uowService: UnitOfWorkService,
    @Inject(FILE_UPLOAD_SERVICE_PROVIDER_KEY)
    private readonly fileUploadService: FileUploadService,
    @Inject(OCR_SERVICE_PROVIDER_KEY)
    private readonly ocrService: OCRService,
    private readonly fileRepository: FileRepositoryImpl,
    private readonly configService: ConfigService,
  ) {
    this.mapper = new QuizGenerationTaskMapper();
    this.useCaseFactory = new QuizGenerationTaskUseCaseFactory(
      this.llmService,
      this.questionRepository,
      this.answerRepository,
      this.quizGenerationTaskRepository,
      this.userRepository,
      this.fileRepository,
      this.fileUploadService,
      this.ocrService,
    );
    this.bucketName =
      this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
  }

  async createTask(
    createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    const {
      text,
      userId,
      isFileUpload = false,
      fileExtension,
    } = createQuizGenerationTaskDto;

    try {
      return await this.uowService.doTransactional(async () => {
        const createQuizGenerationTaskUseCase =
          this.useCaseFactory.createCreateTaskUseCase();

        // Generate a file path with the UUID and file extension if this is a file upload
        let filePath: string | undefined;
        if (isFileUpload && fileExtension) {
          filePath = `uploads/${randomUUID()}.${fileExtension}`;
        }

        const { quizGenerationTask, fileUploadUrl } =
          await createQuizGenerationTaskUseCase.execute({
            userId,
            text,
            isFileUpload,
            filePath,
            bucketName: this.bucketName,
          });

        return this.mapper.toTaskResponse(
          quizGenerationTask,
          userId,
          fileUploadUrl,
        );
      });
    } catch (error) {
      this.logError('Failed to create quiz generation task', error);
      throw error;
    }
  }

  async getTaskById(
    taskId: string,
    userId: string,
  ): Promise<TaskDetailResponse> {
    try {
      const fetchTaskUseCase = this.useCaseFactory.createFetchTaskUseCase();

      const { task } = await fetchTaskUseCase.execute({
        userId,
        taskId,
      });

      return this.mapper.toTaskDetailResponse(task);
    } catch (error) {
      this.handleGetTaskError(error, userId, taskId);
      throw error;
    }
  }

  async fetchTasksByUserId(
    fetchQuizGenerationTasksDto: FetchQuizGenerationTasksDto,
  ): Promise<PaginatedTasksResponse> {
    try {
      const fetchQuizGenerationTasksForUserUseCase =
        this.useCaseFactory.createFetchTasksUseCase();

      const { tasks, pagination } =
        await fetchQuizGenerationTasksForUserUseCase.execute({
          userId: fetchQuizGenerationTasksDto.userId,
          pagination: {
            page: fetchQuizGenerationTasksDto.page || 1,
            limit: fetchQuizGenerationTasksDto.limit || 10,
          },
        });

      return {
        data: tasks.map((task) => this.mapper.toTaskSummaryResponse(task)),
        meta: pagination!,
      };
    } catch (error) {
      this.handleFetchTasksError(error, fetchQuizGenerationTasksDto.userId);
      throw error;
    }
  }

  /**
   * Fetches only ongoing quiz generation tasks (PENDING or IN_PROGRESS) for a user
   * @param userId The ID of the user
   * @returns An array of task summary responses for ongoing tasks
   */
  async fetchOngoingTasksByUserId(
    userId: string,
  ): Promise<TaskSummaryResponse[]> {
    try {
      const fetchOngoingTasksUseCase =
        this.useCaseFactory.createFetchOngoingTasksUseCase();

      const { tasks } = await fetchOngoingTasksUseCase.execute({ userId });

      const data = tasks.map((task) => this.mapper.toTaskSummaryResponse(task));

      return data;
    } catch (error) {
      this.handleFetchTasksError(error, userId);
      throw error;
    }
  }

  async deleteTask(
    taskId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.uowService.doTransactional(async () => {
        const deleteTaskUseCase = this.useCaseFactory.createDeleteTaskUseCase();

        return await deleteTaskUseCase.execute({
          userId,
          taskId,
        });
      });
    } catch (error) {
      this.handleDeleteTaskError(error, userId, taskId);
      throw error;
    }
  }

  /**
   * Resumes a quiz generation task after file upload
   * @param taskId The ID of the task to resume
   * @param userId The ID of the user who owns the task
   * @returns A response indicating success and the updated task
   */
  async resumeTask(
    taskId: string,
    userId: string,
  ): Promise<{ success: boolean; task: TaskDetailResponse }> {
    try {
      const resumeTaskUseCase =
        this.useCaseFactory.createResumeTaskAfterUploadUseCase();

      const { success, task } = await resumeTaskUseCase.execute({
        taskId,
        userId,
      });

      return {
        success,
        task: this.mapper.toTaskDetailResponse(task),
      };
    } catch (error) {
      this.handleResumeTaskError(error, userId, taskId);
      throw error;
    }
  }

  private handleGetTaskError(
    error: unknown,
    userId: string,
    taskId: string,
  ): void {
    if (error instanceof TaskNotFoundError) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof UnauthorizedTaskAccessError) {
      throw new NotFoundException('Quiz generation task not found');
    }
    if (error instanceof UserNotFoundError) {
      throw new BadRequestException(`User with ID '${userId}' not found`);
    }

    this.logError(
      `Failed to get quiz generation task with id ${taskId}`,
      error,
    );
  }

  private handleFetchTasksError(error: unknown, userId: string): void {
    if (error instanceof UserNotFoundError) {
      throw new BadRequestException(`User with ID '${userId}' not found`);
    }

    this.logError('Failed to fetch quiz generation tasks', error);
  }

  private handleDeleteTaskError(
    error: unknown,
    userId: string,
    taskId: string,
  ): void {
    if (error instanceof TaskNotFoundError) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof UnauthorizedTaskAccessError) {
      throw new NotFoundException('Quiz generation task not found');
    }
    if (error instanceof UserNotFoundError) {
      throw new BadRequestException(`User with ID '${userId}' not found`);
    }

    this.logError(
      `Failed to delete quiz generation task with id ${taskId}`,
      error,
    );
  }

  /**
   * Handles errors that occur when resuming a task
   * @param error The error that occurred
   * @param userId The ID of the user who was attempting to resume the task
   * @param taskId The ID of the task that was being resumed
   */
  private handleResumeTaskError(
    error: unknown,
    userId: string,
    taskId: string,
  ): void {
    if (error instanceof TaskNotFoundError) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof UnauthorizedTaskAccessError) {
      throw new NotFoundException('Quiz generation task not found');
    }
    if (error instanceof UserNotFoundError) {
      throw new BadRequestException(`User with ID '${userId}' not found`);
    }

    this.logError(
      `Failed to resume quiz generation task with id ${taskId}`,
      error,
    );
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    } else {
      this.logger.error(`${message}: Unknown error type`, String(error));
    }
  }
}
