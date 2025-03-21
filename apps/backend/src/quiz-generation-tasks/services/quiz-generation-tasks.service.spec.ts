/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

// Mock core use cases to avoid hoisting issues
jest.mock('@eclairum/core/use-cases', () => {
  const originalModule = jest.requireActual('@eclairum/core/use-cases');
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
  // Service instance
  let service: QuizGenerationTasksService;

  // Mock dependencies
  let mockQuestionRepository: Partial<QuestionRepositoryImpl>;
  let mockAnswerRepository: Partial<AnswerRepositoryImpl>;
  let mockTaskRepository: Partial<QuizGenerationTaskRepositoryImpl>;
  let mockLlmService: Partial<LLMService>;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockTransactionHelper: { executeInTransaction: jest.Mock };
  let mockEntityManager: Partial<EntityManager>;

  // Mock use case instances
  let mockCreateUseCase: { execute: jest.Mock };
  let mockFetchTasksUseCase: { execute: jest.Mock };
  let mockFetchTaskUseCase: { execute: jest.Mock };

  // Test data generators
  const generateQuizDto = () => ({
    text: faker.lorem.paragraphs(3),
    userId: faker.string.uuid(),
  });

  const generateTask = (
    userId: string,
    text: string,
    status = QuizGenerationStatus.COMPLETED,
  ): QuizGenerationTask => {
    const task = new QuizGenerationTask({
      textContent: text,
      questions: [],
      status,
      userId,
    });

    task.getId = jest.fn().mockReturnValue(faker.string.uuid());
    task.getQuestions = jest.fn().mockReturnValue([]);
    task.getStatus = jest.fn().mockReturnValue(status);
    task.getGeneratedAt = jest.fn().mockReturnValue(faker.date.recent());
    task.getTitle = jest.fn().mockReturnValue(faker.lorem.sentence());
    task.getCreatedAt = jest.fn().mockReturnValue(faker.date.past());
    task.getUpdatedAt = jest.fn().mockReturnValue(faker.date.recent());
    task.getTextContent = jest.fn().mockReturnValue(text);

    return task;
  };

  const generateTaskWithQuestions = (
    userId: string,
    text: string,
    questionCount = 3,
  ): QuizGenerationTask => {
    const task = generateTask(userId, text);
    const questions = Array(questionCount)
      .fill(null)
      .map(() => generateQuestion(task.getId()));

    task.getQuestions = jest.fn().mockReturnValue(questions);
    return task;
  };

  const generateQuestion = (taskId: string): Question => {
    const question = new Question({
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      quizGenerationTaskId: taskId,
      answers: [],
    });

    question.getId = jest.fn().mockReturnValue(faker.string.uuid());
    question.getContent = jest.fn().mockReturnValue(faker.lorem.sentence());
    question.getAnswers = jest.fn().mockReturnValue(
      Array(4)
        .fill(null)
        .map((_, idx) => generateAnswer(question.getId(), idx === 0)),
    );

    return question;
  };

  const generateAnswer = (questionId: string, isCorrect: boolean): Answer => {
    const answer = new Answer({
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      isCorrect,
      questionId,
    });

    answer.getId = jest.fn().mockReturnValue(faker.string.uuid());
    answer.getContent = jest.fn().mockReturnValue(faker.lorem.sentence());
    answer.getIsCorrect = jest.fn().mockReturnValue(isCorrect);

    return answer;
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock use cases with controllable execute methods
    mockCreateUseCase = { execute: jest.fn() };
    mockFetchTasksUseCase = { execute: jest.fn() };
    mockFetchTaskUseCase = { execute: jest.fn() };

    // Setup mock implementations for use case factories
    (CreateQuizGenerationTaskUseCase as jest.Mock).mockImplementation(
      () => mockCreateUseCase,
    );
    (FetchQuizGenerationTasksForUserUseCase as jest.Mock).mockImplementation(
      () => mockFetchTasksUseCase,
    );
    (FetchQuizGenerationTaskForUserUseCase as jest.Mock).mockImplementation(
      () => mockFetchTaskUseCase,
    );

    // Create mock entity manager
    mockEntityManager = {};

    // Create mock repositories and services
    mockQuestionRepository = { setEntityManager: jest.fn() };
    mockAnswerRepository = { setEntityManager: jest.fn() };
    mockTaskRepository = { setEntityManager: jest.fn() };
    mockLlmService = { generateQuiz: jest.fn() };
    mockUserRepository = { findById: jest.fn() };
    mockTransactionHelper = {
      executeInTransaction: jest.fn((callback) =>
        callback(mockEntityManager as EntityManager),
      ),
    };

    // Initialize the testing module
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuizGenerationTasksService,
        { provide: QuestionRepositoryImpl, useValue: mockQuestionRepository },
        { provide: AnswerRepositoryImpl, useValue: mockAnswerRepository },
        {
          provide: QuizGenerationTaskRepositoryImpl,
          useValue: mockTaskRepository,
        },
        { provide: LLM_SERVICE_PROVIDER_KEY, useValue: mockLlmService },
        { provide: UserRepositoryImpl, useValue: mockUserRepository },
        { provide: TransactionHelper, useValue: mockTransactionHelper },
      ],
    }).compile();

    service = moduleRef.get<QuizGenerationTasksService>(
      QuizGenerationTasksService,
    );

    // Silence logger during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should successfully create a quiz generation task', async () => {
      // Given
      const quizDto = generateQuizDto();
      const mockTask = generateTask(quizDto.userId, quizDto.text);
      mockCreateUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // When
      const result = await service.createTask(quizDto);

      // Then
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
        userId: quizDto.userId,
        text: quizDto.text,
      });

      expect(result).toEqual({
        taskId: mockTask.getId(),
        userId: quizDto.userId,
        status: mockTask.getStatus(),
        questionsCount: 0,
        message: expect.stringContaining('Quiz generation task created'),
        generatedAt: mockTask.getGeneratedAt(),
      });
    });

    it('should configure repositories for transaction and free them afterward', async () => {
      // Given
      const quizDto = generateQuizDto();
      const mockTask = generateTask(quizDto.userId, quizDto.text);
      mockCreateUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // When
      await service.createTask(quizDto);

      // Then
      expect(mockQuestionRepository.setEntityManager).toHaveBeenCalledWith(
        mockEntityManager,
      );
      expect(mockAnswerRepository.setEntityManager).toHaveBeenCalledWith(
        mockEntityManager,
      );
      expect(mockTaskRepository.setEntityManager).toHaveBeenCalledWith(
        mockEntityManager,
      );

      // Verify repositories are freed after transaction
      expect(mockQuestionRepository.setEntityManager).toHaveBeenCalledWith(
        null,
      );
      expect(mockAnswerRepository.setEntityManager).toHaveBeenCalledWith(null);
      expect(mockTaskRepository.setEntityManager).toHaveBeenCalledWith(null);
    });

    it('should log and propagate errors from the use case', async () => {
      // Given
      const quizDto = generateQuizDto();
      const error = new Error('Core use case error');
      mockCreateUseCase.execute.mockRejectedValue(error);
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.createTask(quizDto)).rejects.toThrow(
        'Core use case error',
      );
      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create quiz generation task'),
        expect.any(String),
      );
    });

    it('should handle non-Error type exceptions and log them properly', async () => {
      // Given
      const quizDto = generateQuizDto();
      const nonErrorException = 'String exception';
      mockCreateUseCase.execute.mockRejectedValue(nonErrorException);
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.createTask(quizDto)).rejects.toBe(nonErrorException);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create quiz generation task'),
        String(nonErrorException),
      );
    });
  });

  describe('getTaskById', () => {
    it('should return task details when the task exists and belongs to the user', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const mockTask = generateTaskWithQuestions(
        userId,
        faker.lorem.paragraph(),
      );
      mockFetchTaskUseCase.execute.mockResolvedValue({ task: mockTask });

      // When
      const result = await service.getTaskById(taskId, userId);

      // Then
      expect(mockFetchTaskUseCase.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });

      expect(result).toEqual({
        id: mockTask.getId(),
        status: mockTask.getStatus(),
        title: mockTask.getTitle(),
        textContent: mockTask.getTextContent(), // Added this line to match the service response
        createdAt: mockTask.getCreatedAt(),
        updatedAt: mockTask.getUpdatedAt(),
        generatedAt: mockTask.getGeneratedAt(),
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            text: expect.any(String),
            answers: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                text: expect.any(String),
                isCorrect: expect.any(Boolean),
              }),
            ]),
          }),
        ]),
      });
    });

    it('should throw NotFoundException when the task is not found', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockFetchTaskUseCase.execute.mockRejectedValue(
        new TaskNotFoundError(`Task not found: ${taskId}`),
      );
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(logSpy).not.toHaveBeenCalled(); // Error logging not expected for known errors
    });

    it('should throw NotFoundException for unauthorized access attempts', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockFetchTaskUseCase.execute.mockRejectedValue(
        new UnauthorizedTaskAccessError('Unauthorized access'),
      );

      // When/Then
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFetchTaskUseCase.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });
    });

    it('should throw BadRequestException when the user is not found', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockFetchTaskUseCase.execute.mockRejectedValue(
        new UserNotFoundError(`User not found: ${userId}`),
      );

      // When/Then
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockFetchTaskUseCase.execute).toHaveBeenCalledWith({
        userId,
        taskId,
      });
    });

    it('should log and propagate unexpected errors', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const unexpectedError = new Error('Unexpected database error');
      mockFetchTaskUseCase.execute.mockRejectedValue(unexpectedError);
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        unexpectedError,
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to get quiz generation task with id ${taskId}`,
        ),
        expect.any(String),
      );
    });

    it('should handle non-Error type exceptions in getTaskById', async () => {
      // Given
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const nonErrorException = 'String exception';
      mockFetchTaskUseCase.execute.mockRejectedValue(nonErrorException);
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.getTaskById(taskId, userId)).rejects.toBe(
        nonErrorException,
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to get quiz generation task with id ${taskId}`,
        ),
        String(nonErrorException),
      );
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
        .map(() => generateTask(userId, faker.lorem.paragraph()));

      const mockPagination = {
        page,
        limit,
        totalItems: 30,
        totalPages: 2,
      };

      mockFetchTasksUseCase.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination: mockPagination,
      });

      // When
      const result = await service.fetchTasksByUserId({
        userId,
        page, // Pass the page parameter to the service
        limit, // Pass the limit parameter to the service
      });

      // Then
      expect(mockFetchTasksUseCase.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page, limit },
      });

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            status: expect.any(String),
            title: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            questionsCount: expect.any(Number),
          }),
        ]),
        meta: mockPagination,
      });
    });

    it('should use default pagination parameters when not provided', async () => {
      // Given
      const userId = faker.string.uuid();
      const mockTasks = [generateTask(userId, faker.lorem.paragraph())];
      const mockPagination = {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      };

      mockFetchTasksUseCase.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination: mockPagination,
      });

      // When
      const result = await service.fetchTasksByUserId({ userId });

      // Then
      expect(mockFetchTasksUseCase.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page: 1, limit: 10 },
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual(mockPagination);
    });

    it('should throw BadRequestException when the user is not found', async () => {
      // Given
      const userId = faker.string.uuid();
      mockFetchTasksUseCase.execute.mockRejectedValue(
        new UserNotFoundError(`User not found: ${userId}`),
      );

      // When/Then
      await expect(service.fetchTasksByUserId({ userId })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockFetchTasksUseCase.execute).toHaveBeenCalled();
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

      mockFetchTasksUseCase.execute.mockResolvedValue({
        tasks: [],
        pagination: mockPagination,
      });

      // When
      const result = await service.fetchTasksByUserId({ userId });

      // Then
      expect(result.data).toEqual([]);
      expect(result.meta).toEqual(mockPagination);
    });

    it('should log and propagate unexpected errors when fetching tasks', async () => {
      // Given
      const userId = faker.string.uuid();
      const unexpectedError = new Error('Database connection error');
      mockFetchTasksUseCase.execute.mockRejectedValue(unexpectedError);
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.fetchTasksByUserId({ userId })).rejects.toThrow(
        unexpectedError,
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch quiz generation tasks'),
        expect.any(String),
      );
    });

    it('should handle non-Error type exceptions in fetchTasksByUserId', async () => {
      // Given
      const userId = faker.string.uuid();
      const nonErrorException = 'String exception';
      mockFetchTasksUseCase.execute.mockRejectedValue(nonErrorException);
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When/Then
      await expect(service.fetchTasksByUserId({ userId })).rejects.toBe(
        nonErrorException,
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch quiz generation tasks'),
        String(nonErrorException),
      );
    });
  });
});
