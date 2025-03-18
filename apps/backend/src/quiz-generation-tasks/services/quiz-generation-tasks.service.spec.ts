import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';

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
  };
});

// Import after mocking to avoid hoisting issues
import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTasksForUserUseCase,
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

    // Setup the mock implementation to return our controllable instances
    (CreateQuizGenerationTaskUseCase as jest.Mock).mockImplementation(
      () => mockCreateUseCaseInstance,
    );

    (FetchQuizGenerationTasksForUserUseCase as jest.Mock).mockImplementation(
      () => mockFetchUseCaseInstance,
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
    it('should successfully create and process a quiz generation task', async () => {
      // Arrange
      const createQuizDto = createTestQuizDto();
      const mockTask = createMockTask(createQuizDto.userId, createQuizDto.text);
      const taskId = mockTask.getId();
      const generatedDate = mockTask.getGeneratedAt();

      // Configure the mock to return our task
      mockCreateUseCaseInstance.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // Act
      const result = await quizGenerationTasksService.createTask(createQuizDto);

      // Assert
      expect(mockTransactionHelper.executeInTransaction).toHaveBeenCalled();
      expect(mockQuestionRepository.setEntityManager).toHaveBeenCalled();
      expect(mockAnswerRepository.setEntityManager).toHaveBeenCalled();
      expect(mockTaskRepository.setEntityManager).toHaveBeenCalled();

      expect(mockCreateUseCaseInstance.execute).toHaveBeenCalledWith({
        userId: createQuizDto.userId,
        text: createQuizDto.text,
      });

      expect(result).toEqual({
        taskId,
        userId: createQuizDto.userId,
        status: QuizGenerationStatus.COMPLETED,
        questionsCount: 0,
        message: expect.stringContaining(
          'Quiz generation task created with',
        ) as string,
        generatedAt: generatedDate,
      });
    });

    it('should handle and log errors during task creation', async () => {
      // Arrange
      const createQuizDto = createTestQuizDto();
      const errorMessage = faker.lorem.sentence();
      mockTransactionHelper.executeInTransaction = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      // Mock the error logger
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(
        quizGenerationTasksService.createTask(createQuizDto),
      ).rejects.toThrow(errorMessage);

      expect(mockTransactionHelper.executeInTransaction).toHaveBeenCalled();
      expect(errorLogSpy).toHaveBeenCalled();
    });

    it('should handle quiz generation with different statuses', async () => {
      // Arrange
      const createQuizDto = createTestQuizDto();
      const mockTask = createMockTask(createQuizDto.userId, createQuizDto.text);

      mockTask.getStatus = jest
        .fn()
        .mockReturnValue(QuizGenerationStatus.IN_PROGRESS);

      mockCreateUseCaseInstance.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // Act
      const result = await quizGenerationTasksService.createTask(createQuizDto);

      // Assert
      expect(result.status).toBe(QuizGenerationStatus.IN_PROGRESS);
    });

    it('should free repositories from transaction after completion', async () => {
      // Arrange
      const createQuizDto = createTestQuizDto();
      const mockTask = createMockTask(createQuizDto.userId, createQuizDto.text);

      mockCreateUseCaseInstance.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // Reset the mocks to track new calls
      jest.clearAllMocks();

      // Spy on the private method by replacing it with a mock
      const freeRepoSpy = jest.spyOn(
        QuizGenerationTasksService.prototype as any,
        'freeRepositoriesFromTransaction',
      );

      // Act
      await quizGenerationTasksService.createTask(createQuizDto);

      // Assert
      expect(freeRepoSpy).toHaveBeenCalled();

      // Clean up
      freeRepoSpy.mockRestore();
    });
  });

  describe('getTaskById', () => {
    it('should retrieve a task by ID', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const text = faker.lorem.paragraphs(1);
      const taskId = faker.string.uuid();
      const mockTask = createMockTask(userId, text);

      mockTaskRepository.findById = jest.fn().mockResolvedValue(mockTask);

      // Act
      const result = await quizGenerationTasksService.getTaskById(taskId);

      // Assert
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(result).toBe(mockTask);
    });

    it('should return null when task is not found', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockTaskRepository.findById = jest.fn().mockResolvedValue(null);

      // Act
      const result = await quizGenerationTasksService.getTaskById(taskId);

      // Assert
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(result).toBeNull();
    });

    it('should handle errors when fetching task by id', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const errorMessage = 'Database error';

      mockTaskRepository.findById = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        quizGenerationTasksService.getTaskById(taskId),
      ).rejects.toThrow(errorMessage);

      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
    });
  });

  describe('configureRepositoriesForTransaction', () => {
    it('should configure all repositories with the entity manager', () => {
      // Arrange
      const mockEntityManager = {} as EntityManager;

      // Act - calling the private method through its usage in createTask
      mockTransactionHelper.executeInTransaction.mockImplementation(
        (callback: (entityManager: EntityManager) => void) =>
          callback(mockEntityManager),
      );

      // Fix: Create a mock task that will be returned from the use case
      const mockTask = createMockTask('user-id', 'test');
      mockCreateUseCaseInstance.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      void quizGenerationTasksService.createTask({
        text: 'test',
        userId: 'user-id',
      });

      // Assert
      expect(mockQuestionRepository.setEntityManager).toHaveBeenCalledWith(
        mockEntityManager,
      );
      expect(mockAnswerRepository.setEntityManager).toHaveBeenCalledWith(
        mockEntityManager,
      );
      expect(mockTaskRepository.setEntityManager).toHaveBeenCalledWith(
        mockEntityManager,
      );
    });
  });

  describe('fetchTasksByUserId', () => {
    it('should successfully fetch tasks for a user with pagination', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const page = 1;
      const limit = 10;

      const mockTasks = Array(3)
        .fill(null)
        .map(() => createMockTask(userId, faker.lorem.paragraph()));

      const mockPagination = {
        page,
        limit,
        totalItems: mockTasks.length,
        totalPages: Math.ceil(mockTasks.length / limit),
      };

      mockFetchUseCaseInstance.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination: mockPagination,
      });

      // Act
      const result = await quizGenerationTasksService.fetchTasksByUserId({
        userId,
        page,
        limit,
      });

      // Assert
      expect(mockFetchUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page, limit },
      });

      expect(result).toEqual({
        data: mockTasks.map((task) => ({
          id: task.getId(),
          status: task.getStatus(),
          title: task.getTitle(),
          createdAt: task.getCreatedAt(),
          updatedAt: task.getUpdatedAt(),
          questionsCount: task.getQuestions().length,
        })),
        meta: mockPagination,
      });
    });

    it('should use default pagination values when not provided', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockTasks = [createMockTask(userId, faker.lorem.paragraph())];

      mockFetchUseCaseInstance.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });

      // Act
      const result = await quizGenerationTasksService.fetchTasksByUserId({
        userId,
      });

      // Assert
      expect(mockFetchUseCaseInstance.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page: 1, limit: 10 },
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toBeDefined();
    });

    it('should handle and log errors during task fetching', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const errorMessage = faker.lorem.sentence();

      mockFetchUseCaseInstance.execute.mockRejectedValue(
        new Error(errorMessage),
      );

      // Mock the error logger
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(
        quizGenerationTasksService.fetchTasksByUserId({ userId }),
      ).rejects.toThrow(errorMessage);

      expect(errorLogSpy).toHaveBeenCalled();
    });

    it('should map task entities to summary responses correctly', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockTask = createMockTask(userId, faker.lorem.paragraph());
      const taskId = faker.string.uuid();
      const title = 'Test Quiz';
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const questions = Array(5).fill(null);

      mockTask.getId = jest.fn().mockReturnValue(taskId);
      mockTask.getTitle = jest.fn().mockReturnValue(title);
      mockTask.getCreatedAt = jest.fn().mockReturnValue(createdAt);
      mockTask.getUpdatedAt = jest.fn().mockReturnValue(updatedAt);
      mockTask.getQuestions = jest.fn().mockReturnValue(questions);

      mockFetchUseCaseInstance.execute.mockResolvedValue({
        tasks: [mockTask],
        pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      });

      // Act
      const result = await quizGenerationTasksService.fetchTasksByUserId({
        userId,
      });

      // Assert
      expect(result.data[0]).toEqual({
        id: taskId,
        status: mockTask.getStatus(),
        title,
        createdAt,
        updatedAt,
        questionsCount: questions.length,
      });
    });
  });
});
