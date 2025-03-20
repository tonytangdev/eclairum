import { Test } from '@nestjs/testing';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
  Question,
  Answer,
} from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  UserNotFoundError,
} from '@eclairum/core/errors';
import { TaskDetailResponse } from '../dto/fetch-quiz-generation-task.response.dto';
import { TaskSummaryResponse } from '../dto/fetch-quiz-generation-tasks.response.dto';

// Fix for hoisting issue - mock the module before imports
jest.mock('@eclairum/core/use-cases', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('@eclairum/core/use-cases');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    CreateQuizGenerationTaskUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn(),
    })),
    FetchQuizGenerationTasksForUserUseCase: jest
      .fn()
      .mockImplementation(() => ({
        execute: jest.fn(),
      })),
    FetchQuizGenerationTaskForUserUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn(),
    })),
  };
});

// Import after mocking to avoid hoisting issues
import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTasksForUserUseCase,
  FetchQuizGenerationTaskForUserUseCase,
} from '@eclairum/core/use-cases';

describe('QuizGenerationTasksService', () => {
  let quizGenerationTasksService: QuizGenerationTasksService;
  let mockQuestionRepository: Partial<QuestionRepositoryImpl>;
  let mockAnswerRepository: Partial<AnswerRepositoryImpl>;
  let mockTaskRepository: Partial<QuizGenerationTaskRepositoryImpl>;
  let mockLlmService: Partial<LLMService>;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockTransactionHelper: Partial<TransactionHelper> & {
    executeInTransaction: jest.Mock;
  };
  let mockCreateUseCaseInstance: { execute: jest.Mock };
  let mockFetchUseCaseInstance: { execute: jest.Mock };
  let mockFetchTaskUseCaseInstance: { execute: jest.Mock };

  // Test data generators using faker
  const createTestQuizDto = () => ({
    text: faker.lorem.paragraphs(3),
    userId: faker.string.uuid(),
  });

  const createMockTask = (userId: string, text: string) => {
    const task = new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.COMPLETED,
      userId: userId,
    });

    task.getId = jest.fn().mockReturnValue(faker.string.uuid());
    task.getQuestions = jest.fn().mockReturnValue([]);
    task.getStatus = jest.fn().mockReturnValue(QuizGenerationStatus.COMPLETED);
    task.getGeneratedAt = jest.fn().mockReturnValue(faker.date.recent());
    task.getTitle = jest.fn().mockReturnValue(faker.lorem.sentence());
    task.getCreatedAt = jest.fn().mockReturnValue(faker.date.past());
    task.getUpdatedAt = jest.fn().mockReturnValue(faker.date.recent());

    return task;
  };

  const createMockTaskWithQuestions = (
    userId: string,
    text: string,
    questionCount = 3,
  ) => {
    const task = createMockTask(userId, text);

    const questions = Array(questionCount)
      .fill(null)
      .map(() => {
        const question = new Question({
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
          quizGenerationTaskId: task.getId(),
          answers: [],
        });

        question.getId = jest.fn().mockReturnValue(faker.string.uuid());
        question.getContent = jest.fn().mockReturnValue(faker.lorem.sentence());

        const answers = Array(4)
          .fill(null)
          .map((_, idx) => {
            const answer = new Answer({
              id: faker.string.uuid(),
              content: faker.lorem.sentence(),
              isCorrect: idx === 0, // First answer is correct
              questionId: question.getId(),
            });

            answer.getId = jest.fn().mockReturnValue(faker.string.uuid());
            answer.getContent = jest
              .fn()
              .mockReturnValue(faker.lorem.sentence());
            answer.getIsCorrect = jest.fn().mockReturnValue(idx === 0);

            return answer;
          });

        question.getAnswers = jest.fn().mockReturnValue(answers);

        return question;
      });

    task.getQuestions = jest.fn().mockReturnValue(questions);

    return task;
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock execute functions that we can control in tests
    mockCreateUseCaseInstance = {
      execute: jest.fn(),
    };

    mockFetchUseCaseInstance = {
      execute: jest.fn(),
    };

    mockFetchTaskUseCaseInstance = {
      execute: jest.fn(),
    };

    // Setup the mock implementation to return our controllable instances
    (CreateQuizGenerationTaskUseCase as jest.Mock).mockImplementation(
      () => mockCreateUseCaseInstance,
    );

    (FetchQuizGenerationTasksForUserUseCase as jest.Mock).mockImplementation(
      () => mockFetchUseCaseInstance,
    );

    (FetchQuizGenerationTaskForUserUseCase as jest.Mock).mockImplementation(
      () => mockFetchTaskUseCaseInstance,
    );

    // Create mock implementations for all dependencies
    mockQuestionRepository = {
      setEntityManager: jest.fn(),
      saveQuestions: jest.fn().mockResolvedValue(undefined),
    };

    mockAnswerRepository = {
      setEntityManager: jest.fn(),
      saveAnswers: jest.fn().mockResolvedValue(undefined),
    };

    mockTaskRepository = {
      setEntityManager: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };

    mockLlmService = {
      generateQuiz: jest.fn().mockResolvedValue([]),
    };

    mockUserRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };

    mockTransactionHelper = {
      executeInTransaction: jest
        .fn()
        .mockImplementation(
          (callback: (entityManager: EntityManager) => void) => {
            const mockEntityManager = {} as EntityManager;
            return callback(mockEntityManager);
          },
        ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuizGenerationTasksService,
        { provide: QuestionRepositoryImpl, useValue: mockQuestionRepository },
        { provide: AnswerRepositoryImpl, useValue: mockAnswerRepository },
        {
          provide: QuizGenerationTaskRepositoryImpl,
          useValue: mockTaskRepository,
        },
        {
          provide: LLM_SERVICE_PROVIDER_KEY,
          useValue: mockLlmService,
        },
        { provide: UserRepositoryImpl, useValue: mockUserRepository },
        { provide: TransactionHelper, useValue: mockTransactionHelper },
      ],
    }).compile();

    quizGenerationTasksService = moduleRef.get<QuizGenerationTasksService>(
      QuizGenerationTasksService,
    );

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a quiz generation task and return task details', async () => {
      // Given
      const createQuizDto = createTestQuizDto();
      const mockTask = createMockTask(createQuizDto.userId, createQuizDto.text);

      mockCreateUseCaseInstance.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // When
      const result = await quizGenerationTasksService.createTask(createQuizDto);

      // Then
      expect(result).toEqual({
        taskId: mockTask.getId(),
        userId: createQuizDto.userId,
        status: mockTask.getStatus(),
        questionsCount: 0,
        message: expect.stringContaining(
          'Quiz generation task created with',
        ) as string,
        generatedAt: mockTask.getGeneratedAt(),
      });
      expect(mockCreateUseCaseInstance.execute).toHaveBeenCalledWith({
        userId: createQuizDto.userId,
        text: createQuizDto.text,
      });
    });

    it('should propagate errors from the core use case', async () => {
      // Given
      const createQuizDto = createTestQuizDto();
      const error = new Error('Core use case error');

      mockCreateUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.createTask(createQuizDto),
      ).rejects.toThrow('Core use case error');
      expect(mockCreateUseCaseInstance.execute).toHaveBeenCalled();
    });

    it('should log errors when task creation fails', async () => {
      // Given
      const createQuizDto = createTestQuizDto();
      const error = new Error('Creation failed');
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error');

      mockCreateUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.createTask(createQuizDto),
      ).rejects.toThrow();
      expect(errorLogSpy).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return task details when the task exists and belongs to the user', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const mockTask = createMockTaskWithQuestions(
        userId,
        faker.lorem.paragraph(),
      );

      mockFetchTaskUseCaseInstance.execute.mockResolvedValue({
        task: mockTask,
      });

      // When
      const result = await quizGenerationTasksService.getTaskById(
        taskId,
        userId,
      );

      // Then
      expect(result).toEqual({
        id: mockTask.getId(),
        status: mockTask.getStatus(),
        title: mockTask.getTitle(),
        createdAt: mockTask.getCreatedAt(),
        updatedAt: mockTask.getUpdatedAt(),
        generatedAt: mockTask.getGeneratedAt(),
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String) as string,
            text: expect.any(String) as string,
            answers: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String) as string,
                text: expect.any(String) as string,
                isCorrect: expect.any(Boolean) as boolean,
              }) as Record<string, unknown>,
            ]) as unknown as Array<{
              id: string;
              text: string;
              isCorrect: boolean;
            }>,
          }) as Record<string, unknown>,
        ]) as unknown as TaskDetailResponse['questions'],
      } as TaskDetailResponse);
      expect(mockFetchTaskUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });
    });

    it('should throw NotFoundException when the task is not found', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const error = new TaskNotFoundError(`Task not found: ${taskId}`);

      mockFetchTaskUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.getTaskById(taskId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(mockFetchTaskUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });
    });

    it('should throw NotFoundException for unauthorized access attempts', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const error = new UnauthorizedTaskAccessError('Unauthorized access');

      mockFetchTaskUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.getTaskById(taskId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(mockFetchTaskUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });
    });

    it('should throw BadRequestException when the user is not found', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const error = new UserNotFoundError(`User not found: ${userId}`);

      mockFetchTaskUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.getTaskById(taskId, userId),
      ).rejects.toThrow(BadRequestException);
      expect(mockFetchTaskUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });
    });

    it('should log and propagate unexpected errors', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const error = new Error('Unexpected error');
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error');

      mockFetchTaskUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.getTaskById(taskId, userId),
      ).rejects.toThrow('Unexpected error');
      expect(errorLogSpy).toHaveBeenCalled();
    });
  });

  describe('fetchTasksByUserId', () => {
    it('should return paginated tasks when the user exists', async () => {
      // Given
      const userId = faker.string.uuid();
      const page = 2;
      const limit = 15;
      const mockTasks = Array(3)
        .fill(null)
        .map(() => createMockTask(userId, faker.lorem.paragraph()));

      const mockPagination = {
        page,
        limit,
        totalItems: 30,
        totalPages: 2,
      };

      mockFetchUseCaseInstance.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination: mockPagination,
      });

      // When
      const result = await quizGenerationTasksService.fetchTasksByUserId({
        userId,
        page,
        limit,
      });

      // Then
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String) as string,
            status: expect.any(String) as string,
            title: expect.any(String) as string,
            createdAt: expect.any(Date) as Date,
            updatedAt: expect.any(Date) as Date,
            questionsCount: expect.any(Number) as number,
          }) as TaskSummaryResponse,
        ]) as TaskSummaryResponse[],
        meta: mockPagination,
      });
      expect(mockFetchUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page, limit },
      });
    });

    it('should use default pagination when not provided', async () => {
      // Given
      const userId = faker.string.uuid();
      const mockTasks = [createMockTask(userId, faker.lorem.paragraph())];
      const mockPagination = {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      };

      mockFetchUseCaseInstance.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination: mockPagination,
      });

      // When
      const result = await quizGenerationTasksService.fetchTasksByUserId({
        userId,
      });

      // Then
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual(mockPagination);
      expect(mockFetchUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should throw BadRequestException when the user is not found', async () => {
      // Given
      const userId = faker.string.uuid();
      const error = new UserNotFoundError(`User not found: ${userId}`);

      mockFetchUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.fetchTasksByUserId({ userId }),
      ).rejects.toThrow(BadRequestException);
      expect(mockFetchUseCaseInstance.execute).toHaveBeenCalled();
    });

    it('should log and propagate unexpected errors', async () => {
      // Given
      const userId = faker.string.uuid();
      const error = new Error('Database error');
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error');

      mockFetchUseCaseInstance.execute.mockRejectedValue(error);

      // When/Then
      await expect(
        quizGenerationTasksService.fetchTasksByUserId({ userId }),
      ).rejects.toThrow('Database error');
      expect(errorLogSpy).toHaveBeenCalled();
    });

    it('should handle empty result sets correctly', async () => {
      // Given
      const userId = faker.string.uuid();
      const mockPagination = {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
      };

      mockFetchUseCaseInstance.execute.mockResolvedValue({
        tasks: [],
        pagination: mockPagination,
      });

      // When
      const result = await quizGenerationTasksService.fetchTasksByUserId({
        userId,
      });

      // Then
      expect(result.data).toEqual([]);
      expect(result.meta).toEqual(mockPagination);
    });
  });
});
