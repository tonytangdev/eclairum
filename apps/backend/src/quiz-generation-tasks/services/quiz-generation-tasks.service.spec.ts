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
} from '@flash-me/core/entities';
import { faker } from '@faker-js/faker';
import { LLMService } from '@flash-me/core/interfaces/llm-service.interface';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';

// Fix for hoisting issue - mock the module before imports
jest.mock('@flash-me/core/use-cases', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('@flash-me/core/use-cases');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    CreateQuizGenerationTaskUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn(),
    })),
  };
});

// Import after mocking to avoid hoisting issues
import { CreateQuizGenerationTaskUseCase } from '@flash-me/core/use-cases';

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
  let mockUseCaseInstance: { execute: jest.Mock };

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

    return task;
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock execute function that we can control in tests
    mockUseCaseInstance = {
      execute: jest.fn(),
    };

    // Setup the mock implementation to return our controllable instance
    (CreateQuizGenerationTaskUseCase as jest.Mock).mockImplementation(
      () => mockUseCaseInstance,
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
      mockUseCaseInstance.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // Act
      const result = await quizGenerationTasksService.createTask(createQuizDto);

      // Assert
      expect(mockTransactionHelper.executeInTransaction).toHaveBeenCalled();
      expect(mockQuestionRepository.setEntityManager).toHaveBeenCalled();
      expect(mockAnswerRepository.setEntityManager).toHaveBeenCalled();
      expect(mockTaskRepository.setEntityManager).toHaveBeenCalled();

      expect(mockUseCaseInstance.execute).toHaveBeenCalledWith({
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
      mockUseCaseInstance.execute.mockResolvedValue({
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
});
