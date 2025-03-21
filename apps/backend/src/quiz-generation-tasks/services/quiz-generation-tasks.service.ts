import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { FetchQuizGenerationTasksDto } from '../dto/fetch-quiz-generation-tasks.dto';
import {
  PaginatedTasksResponse,
  TaskResponse,
} from '../dto/fetch-quiz-generation-tasks.response.dto';
import { TaskDetailResponse } from '../dto/fetch-quiz-generation-task.response.dto';
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  UserNotFoundError,
} from '@eclairum/core/errors';
import { QuizGenerationTaskMapper } from '../mappers/quiz-generation-task.mapper';
import { QuizGenerationTaskUseCaseFactory } from '../factories/quiz-generation-task-use-case.factory';

@Injectable()
export class QuizGenerationTasksService {
  private readonly logger = new Logger(QuizGenerationTasksService.name);
  private readonly mapper: QuizGenerationTaskMapper;
  private readonly useCaseFactory: QuizGenerationTaskUseCaseFactory;

  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly transactionHelper: TransactionHelper,
    @Inject(LLM_SERVICE_PROVIDER_KEY)
    private readonly llmService: LLMService,
    private readonly userRepository: UserRepositoryImpl,
  ) {
    this.mapper = new QuizGenerationTaskMapper();
    this.useCaseFactory = new QuizGenerationTaskUseCaseFactory(
      this.llmService,
      this.questionRepository,
      this.answerRepository,
      this.quizGenerationTaskRepository,
      this.userRepository,
    );
  }

  async createTask(
    createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    const { text, userId } = createQuizGenerationTaskDto;

    try {
      return await this.transactionHelper.executeInTransaction(
        async (entityManager) => {
          this.configureRepositoriesForTransaction(entityManager);

          const createQuizGenerationTaskUseCase =
            this.useCaseFactory.createCreateTaskUseCase();

          const { quizGenerationTask } =
            await createQuizGenerationTaskUseCase.execute({
              userId,
              text,
            });

          this.freeRepositoriesFromTransaction();

          return this.mapper.toTaskResponse(quizGenerationTask, userId);
        },
      );
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

  private configureRepositoriesForTransaction(
    entityManager: EntityManager,
  ): void {
    this.questionRepository.setEntityManager(entityManager);
    this.answerRepository.setEntityManager(entityManager);
  }

  private freeRepositoriesFromTransaction(): void {
    this.questionRepository.setEntityManager(null);
    this.answerRepository.setEntityManager(null);
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

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    } else {
      this.logger.error(`${message}: Unknown error type`, String(error));
    }
  }
}
