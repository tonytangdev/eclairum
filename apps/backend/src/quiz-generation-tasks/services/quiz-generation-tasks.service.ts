import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import { QuizGenerationTask } from '@eclairum/core/entities';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';
import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTasksForUserUseCase,
} from '@eclairum/core/use-cases';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { FetchQuizGenerationTasksDto } from '../dto/fetch-quiz-generation-tasks.dto';
import {
  PaginatedTasksResponse,
  TaskResponse,
  TaskSummaryResponse,
} from '../dto/fetch-quiz-generation-tasks.response.dto';
import { TaskDetailResponse } from '../dto/fetch-quiz-generation-task.response.dto';
import { FetchQuizGenerationTaskForUserUseCase } from '@eclairum/core/use-cases';
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  UserNotFoundError,
} from '@eclairum/core/errors';

@Injectable()
export class QuizGenerationTasksService {
  private readonly logger = new Logger(QuizGenerationTasksService.name);

  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly transactionHelper: TransactionHelper,
    @Inject(LLM_SERVICE_PROVIDER_KEY)
    private readonly llmService: LLMService,
    private readonly userRepository: UserRepositoryImpl,
  ) {}

  async createTask(
    createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    const { text, userId } = createQuizGenerationTaskDto;

    try {
      return await this.transactionHelper.executeInTransaction(
        async (entityManager) => {
          // Configure repositories to use the transaction context
          this.configureRepositoriesForTransaction(entityManager);

          // Create the use case instance with the configured repositories
          const createQuizGenerationTaskUseCase = this.createUseCase();

          // Execute the use case
          const { quizGenerationTask } =
            await createQuizGenerationTaskUseCase.execute({
              userId,
              text,
            });

          this.freeRepositoriesFromTransaction();

          return this.createTaskResponse(quizGenerationTask, userId);
        },
      );
    } catch (error) {
      this.logError('Failed to create quiz generation task', error);
      throw error;
    }
  }

  private createUseCase(): CreateQuizGenerationTaskUseCase {
    return new CreateQuizGenerationTaskUseCase(
      this.llmService,
      this.questionRepository,
      this.answerRepository,
      this.quizGenerationTaskRepository,
      this.userRepository,
    );
  }

  // Configure repositories to use the current transaction context
  private configureRepositoriesForTransaction(
    entityManager: EntityManager,
  ): void {
    this.questionRepository.setEntityManager(entityManager);
    this.answerRepository.setEntityManager(entityManager);
    this.quizGenerationTaskRepository.setEntityManager(entityManager);
    // Add any other repositories that need transaction context
  }

  private freeRepositoriesFromTransaction(): void {
    this.questionRepository.setEntityManager(null);
    this.answerRepository.setEntityManager(null);
    this.quizGenerationTaskRepository.setEntityManager(null);
  }

  async getTaskById(
    taskId: string,
    userId: string,
  ): Promise<TaskDetailResponse> {
    try {
      const fetchTaskUseCase = this.createFetchTaskUseCase();

      const { task } = await fetchTaskUseCase.execute({
        userId,
        taskId,
      });

      return this.mapTaskToDetailResponse(task);
    } catch (error) {
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
      throw error;
    }
  }

  private createFetchTaskUseCase(): FetchQuizGenerationTaskForUserUseCase {
    return new FetchQuizGenerationTaskForUserUseCase(
      this.userRepository,
      this.quizGenerationTaskRepository,
    );
  }

  private mapTaskToDetailResponse(
    task: QuizGenerationTask,
  ): TaskDetailResponse {
    const questions = task.getQuestions().map((question) => ({
      id: question.getId(),
      text: question.getContent(),
      answers: question.getAnswers().map((answer) => ({
        id: answer.getId(),
        text: answer.getContent(),
        isCorrect: answer.getIsCorrect(),
      })),
    }));

    return {
      id: task.getId(),
      status: task.getStatus(),
      title: task.getTitle(),
      createdAt: task.getCreatedAt(),
      updatedAt: task.getUpdatedAt(),
      generatedAt: task.getGeneratedAt(),
      questions,
    };
  }

  async fetchTasksByUserId(
    fetchQuizGenerationTasksDto: FetchQuizGenerationTasksDto,
  ): Promise<PaginatedTasksResponse> {
    try {
      const fetchQuizGenerationTasksForUserUseCase =
        this.createFetchTasksUseCase();

      const { tasks, pagination } =
        await fetchQuizGenerationTasksForUserUseCase.execute({
          userId: fetchQuizGenerationTasksDto.userId,
          pagination: {
            page: fetchQuizGenerationTasksDto.page || 1,
            limit: fetchQuizGenerationTasksDto.limit || 10,
          },
        });

      const taskSummaries = tasks.map((task) =>
        this.mapTaskToSummaryResponse(task),
      );

      return {
        data: taskSummaries,
        meta: pagination!,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new BadRequestException(
          `User with ID '${fetchQuizGenerationTasksDto.userId}' not found`,
        );
      }

      this.logError('Failed to fetch quiz generation tasks', error);
      throw error;
    }
  }

  private createFetchTasksUseCase(): FetchQuizGenerationTasksForUserUseCase {
    return new FetchQuizGenerationTasksForUserUseCase(
      this.userRepository,
      this.quizGenerationTaskRepository,
    );
  }

  private mapTaskToSummaryResponse(
    task: QuizGenerationTask,
  ): TaskSummaryResponse {
    return {
      id: task.getId(),
      status: task.getStatus(),
      title: task.getTitle(),
      createdAt: task.getCreatedAt(),
      updatedAt: task.getUpdatedAt(),
      questionsCount: task.getQuestions().length,
    };
  }

  private createTaskResponse(
    task: QuizGenerationTask,
    userId: string,
  ): TaskResponse {
    const taskId = task.getId();
    const questionsCount = task.getQuestions().length;

    return {
      taskId,
      userId,
      status: task.getStatus(),
      questionsCount,
      message: `Quiz generation task created with ${questionsCount} questions`,
      generatedAt: task.getGeneratedAt()!,
    };
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    }
  }
}
