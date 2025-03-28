/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test } from '@nestjs/testing';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { QuizGenerationStatus } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  UserNotFoundError,
} from '@eclairum/core/errors';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';
import { AnswerRepositoryImpl } from '../../repositories/answers/answer.repository';

// Mock core use cases
jest.mock('@eclairum/core/use-cases', () => ({
  __esModule: true,
  CreateQuizGenerationTaskUseCase: jest.fn(() => ({
    execute: jest.fn(),
  })),
  FetchQuizGenerationTasksForUserUseCase: jest.fn(() => ({
    execute: jest.fn(),
  })),
  FetchQuizGenerationTaskForUserUseCase: jest.fn(() => ({
    execute: jest.fn(),
  })),
  SoftDeleteQuizGenerationTaskForUserUseCase: jest.fn(() => ({
    execute: jest.fn(),
  })),
  ResumeQuizGenerationTaskAfterUploadUseCase: jest.fn(() => ({
    execute: jest.fn(),
  })),
  FetchOngoingQuizGenerationTasksUseCase: jest.fn(() => ({
    execute: jest.fn(),
  })),
}));

// Import use cases after mocking
import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTasksForUserUseCase,
  FetchQuizGenerationTaskForUserUseCase,
  SoftDeleteQuizGenerationTaskForUserUseCase,
  ResumeQuizGenerationTaskAfterUploadUseCase,
  FetchOngoingQuizGenerationTasksUseCase,
} from '@eclairum/core/use-cases';
import { FILE_UPLOAD_SERVICE_PROVIDER_KEY } from './s3-file-upload.service';
import { OCR_SERVICE_PROVIDER_KEY } from './textract-ocr.service';
import { FileRepositoryImpl } from '../../repositories/files/file.repository';
import { ConfigService } from '@nestjs/config';

describe('QuizGenerationTasksService', () => {
  // Define test fixtures and service
  let service: QuizGenerationTasksService;
  let createTaskUseCase: { execute: jest.Mock };
  let fetchTasksUseCase: { execute: jest.Mock };
  let fetchTaskUseCase: { execute: jest.Mock };
  let deleteTaskUseCase: { execute: jest.Mock };
  let resumeTaskUseCase: { execute: jest.Mock };
  let fetchOngoingTasksUseCase: { execute: jest.Mock };
  let unitOfWorkService: jest.Mocked<UnitOfWorkService>;
  let mockFileUploadService: { generateUploadUrl: jest.Mock };
  let mockOcrService: { extractTextFromFile: jest.Mock };
  let mockConfigService: { getOrThrow: jest.Mock };

  // Define interfaces for mock objects
  interface MockAnswer {
    getId(): string;
    getContent(): string;
    getIsCorrect(): boolean;
    getQuestionId(): string;
  }

  interface MockQuestion {
    getId(): string;
    getContent(): string;
    getAnswers(): MockAnswer[];
    getQuizGenerationTaskId(): string;
  }

  interface MockQuizGenerationTask {
    getId(): string;
    getTextContent(): string;
    getStatus(): QuizGenerationStatus;
    getQuestions(): MockQuestion[];
    getUserId(): string;
    getTitle(): string | null;
    getCreatedAt(): Date;
    getUpdatedAt(): Date;
    getGeneratedAt(): Date | null;
    getDeletedAt(): Date | null;
  }

  // Factory functions for creating mock objects
  const createMockAnswer = (
    props: {
      id?: string;
      content?: string;
      isCorrect?: boolean;
      questionId?: string;
    } = {},
  ): MockAnswer => ({
    getId: jest.fn().mockReturnValue(props.id || faker.string.uuid()),
    getContent: jest
      .fn()
      .mockReturnValue(props.content || faker.lorem.sentence()),
    getIsCorrect: jest
      .fn()
      .mockReturnValue(
        props.isCorrect !== undefined
          ? props.isCorrect
          : faker.datatype.boolean(),
      ),
    getQuestionId: jest
      .fn()
      .mockReturnValue(props.questionId || faker.string.uuid()),
  });

  const createMockQuestion = (
    props: {
      id?: string;
      content?: string;
      answers?: MockAnswer[];
      taskId?: string;
    } = {},
  ): MockQuestion => ({
    getId: jest.fn().mockReturnValue(props.id || faker.string.uuid()),
    getContent: jest
      .fn()
      .mockReturnValue(props.content || faker.lorem.sentence()),
    getAnswers: jest.fn().mockReturnValue(props.answers || []),
    getQuizGenerationTaskId: jest
      .fn()
      .mockReturnValue(props.taskId || faker.string.uuid()),
  });

  const createMockTask = (
    props: {
      id?: string;
      textContent?: string;
      status?: QuizGenerationStatus;
      questions?: MockQuestion[];
      userId?: string;
      title?: string | null;
      generatedAt?: Date | null;
    } = {},
  ): MockQuizGenerationTask => ({
    getId: jest.fn().mockReturnValue(props.id || faker.string.uuid()),
    getTextContent: jest
      .fn()
      .mockReturnValue(props.textContent || faker.lorem.paragraphs(2)),
    getStatus: jest
      .fn()
      .mockReturnValue(props.status || QuizGenerationStatus.COMPLETED),
    getQuestions: jest.fn().mockReturnValue(props.questions || []),
    getUserId: jest.fn().mockReturnValue(props.userId || faker.string.uuid()),
    getTitle: jest
      .fn()
      .mockReturnValue(
        props.title !== undefined ? props.title : faker.lorem.sentence(),
      ),
    getCreatedAt: jest.fn().mockReturnValue(new Date()),
    getUpdatedAt: jest.fn().mockReturnValue(new Date()),
    getGeneratedAt: jest
      .fn()
      .mockReturnValue(
        props.generatedAt !== undefined ? props.generatedAt : new Date(),
      ),
    getDeletedAt: jest.fn().mockReturnValue(null),
  });

  beforeEach(async () => {
    // Setup use case mocks
    createTaskUseCase = { execute: jest.fn() };
    fetchTasksUseCase = { execute: jest.fn() };
    fetchTaskUseCase = { execute: jest.fn() };
    deleteTaskUseCase = { execute: jest.fn() };
    resumeTaskUseCase = { execute: jest.fn() };
    fetchOngoingTasksUseCase = { execute: jest.fn() };

    // Setup file upload service mock
    mockFileUploadService = { generateUploadUrl: jest.fn() };
    mockOcrService = { extractTextFromFile: jest.fn() };
    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('test-bucket'),
    };

    // Setup use case factory mocks
    (CreateQuizGenerationTaskUseCase as jest.Mock).mockReturnValue(
      createTaskUseCase,
    );
    (FetchQuizGenerationTasksForUserUseCase as jest.Mock).mockReturnValue(
      fetchTasksUseCase,
    );
    (FetchQuizGenerationTaskForUserUseCase as jest.Mock).mockReturnValue(
      fetchTaskUseCase,
    );
    (SoftDeleteQuizGenerationTaskForUserUseCase as jest.Mock).mockReturnValue(
      deleteTaskUseCase,
    );
    (ResumeQuizGenerationTaskAfterUploadUseCase as jest.Mock).mockReturnValue(
      resumeTaskUseCase,
    );
    (FetchOngoingQuizGenerationTasksUseCase as jest.Mock).mockReturnValue(
      fetchOngoingTasksUseCase,
    );

    // Setup transaction mock
    unitOfWorkService = {
      getManager: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      doTransactional: jest.fn().mockImplementation(async (fn) => await fn()),
    } as unknown as jest.Mocked<UnitOfWorkService>;

    // Create test module
    const module = await Test.createTestingModule({
      providers: [
        QuizGenerationTasksService,
        { provide: QuestionRepositoryImpl, useValue: {} },
        { provide: AnswerRepositoryImpl, useValue: {} },
        { provide: QuizGenerationTaskRepositoryImpl, useValue: {} },
        { provide: FileRepositoryImpl, useValue: {} },
        {
          provide: LLM_SERVICE_PROVIDER_KEY,
          useValue: { generateQuiz: jest.fn() },
        },
        { provide: UserRepositoryImpl, useValue: { findById: jest.fn() } },
        { provide: UnitOfWorkService, useValue: unitOfWorkService },
        {
          provide: FILE_UPLOAD_SERVICE_PROVIDER_KEY,
          useValue: mockFileUploadService,
        },
        {
          provide: OCR_SERVICE_PROVIDER_KEY,
          useValue: mockOcrService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<QuizGenerationTasksService>(
      QuizGenerationTasksService,
    );

    // Silence logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task and return a correctly structured response', async () => {
      // Given a task creation request
      const userId = faker.string.uuid();
      const text = 'Test quiz content';
      const createDto = { userId, text };

      // And a mock task that will be returned
      const mockTask = createMockTask({
        userId,
        textContent: text,
        questions: [createMockQuestion(), createMockQuestion()],
      });

      // And the use case will return this task
      createTaskUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // When creating a task
      const result = await service.createTask(createDto);

      // Then the result should have the expected structure
      expect(result).toEqual({
        taskId: mockTask.getId(),
        userId: mockTask.getUserId(),
        status: mockTask.getStatus(),
        questionsCount: 2,
        message: expect.stringContaining(
          'Quiz generation task created',
        ) as string,
        generatedAt: mockTask.getGeneratedAt(),
      });
    });

    it('should create a file upload task with isFileUpload=true and return URL', async () => {
      // Given a file upload task request
      const userId = faker.string.uuid();
      const text = 'Description for file upload';
      const createDto = { userId, text, isFileUpload: true };

      // And a mock file upload URL
      const mockFileUploadUrl = 'https://example.com/upload';

      // And a mock task that will be returned
      const mockTask = createMockTask({
        userId,
        textContent: text,
        status: QuizGenerationStatus.IN_PROGRESS,
        questions: [],
      });

      // And the use case will return this task with a file upload URL
      createTaskUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
        fileUploadUrl: mockFileUploadUrl,
      });

      // When creating a file upload task
      const result = await service.createTask(createDto);

      // Then the result should include the file upload URL
      expect(result).toEqual({
        taskId: mockTask.getId(),
        userId: mockTask.getUserId(),
        status: mockTask.getStatus(),
        questionsCount: 0,
        message: expect.stringContaining(
          'Quiz generation task created',
        ) as string,
        generatedAt: mockTask.getGeneratedAt(),
        fileUploadUrl: mockFileUploadUrl,
      });

      // And the use case should have been called with isFileUpload=true and bucketName
      expect(createTaskUseCase.execute).toHaveBeenCalledWith({
        userId,
        text,
        isFileUpload: true,
        filePath: undefined,
        bucketName: 'test-bucket',
      });
    });

    it('should handle empty text when isFileUpload=true', async () => {
      // Given a file upload task request with empty text
      const userId = faker.string.uuid();
      const createDto = { userId, text: '', isFileUpload: true };

      // And a mock file upload URL
      const mockFileUploadUrl = 'https://example.com/upload';

      // And a mock task that will be returned
      const mockTask = createMockTask({
        userId,
        textContent: 'File upload task', // Default text for file uploads
        status: QuizGenerationStatus.IN_PROGRESS,
      });

      // And the use case will return this task with a file upload URL
      createTaskUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
        fileUploadUrl: mockFileUploadUrl,
      });

      // When creating a file upload task with empty text
      const result = await service.createTask(createDto);

      // Then the result should be correctly structured with the file upload URL
      expect(result).toEqual(
        expect.objectContaining({
          fileUploadUrl: mockFileUploadUrl,
        }),
      );

      // And the use case should have been called with the empty text and bucketName
      expect(createTaskUseCase.execute).toHaveBeenCalledWith({
        userId,
        text: '',
        isFileUpload: true,
        filePath: undefined,
        bucketName: 'test-bucket',
      });
    });

    it('should handle null generatedAt date in response', async () => {
      // Given a task with null generatedAt
      const mockTask = createMockTask({ generatedAt: null });
      createTaskUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // When creating a task
      const result = await service.createTask({
        userId: faker.string.uuid(),
        text: faker.lorem.paragraph(),
      });

      // Then generatedAt should be null in the response
      expect(result.generatedAt).toBeNull();
    });

    it('should propagate errors from use case', async () => {
      // Given a use case that throws an error
      const error = new Error('Failed to create task');
      createTaskUseCase.execute.mockRejectedValue(error);

      // When creating a task, Then it should propagate the error
      await expect(
        service.createTask({
          userId: faker.string.uuid(),
          text: faker.lorem.paragraph(),
        }),
      ).rejects.toThrow(error);
    });

    it('should propagate file upload errors', async () => {
      // Given a file upload error
      const error = new Error('File upload service not configured');
      createTaskUseCase.execute.mockRejectedValue(error);

      // When creating a file upload task
      await expect(
        service.createTask({
          userId: faker.string.uuid(),
          text: 'Description',
          isFileUpload: true,
        }),
      ).rejects.toThrow(error);
    });

    it('should generate correct file path when extension is provided', async () => {
      // Given a file upload task request with file extension
      const userId = faker.string.uuid();
      const text = 'Document to be uploaded';
      const fileExtension = 'pdf';
      const createDto = {
        userId,
        text,
        isFileUpload: true,
        fileExtension,
      };

      // And a mock task that will be returned
      const mockTask = createMockTask({
        userId,
        status: QuizGenerationStatus.IN_PROGRESS,
      });

      // And a mock file upload URL
      const mockFileUploadUrl = 'https://example.com/upload';

      // And the use case will return success
      createTaskUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
        fileUploadUrl: mockFileUploadUrl,
      });

      // When creating a file upload task with an extension
      await service.createTask(createDto);

      // Then the use case should be called with a properly formatted file path
      expect(createTaskUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          text,
          isFileUpload: true,
          filePath: expect.stringMatching(/^uploads\/[a-f0-9-]+\.pdf$/),
          bucketName: 'test-bucket',
        }),
      );

      // Verify the UUID format in the file path
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const filePath = createTaskUseCase.execute.mock.calls[0][0].filePath;
      const uuidPattern =
        /^uploads\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.pdf$/;
      expect(filePath).toMatch(uuidPattern);
    });

    it('should not generate file path when extension is not provided', async () => {
      // Given a file upload task request without file extension
      const userId = faker.string.uuid();
      const text = 'Document to be uploaded';
      const createDto = {
        userId,
        text,
        isFileUpload: true,
        // No fileExtension provided
      };

      // And a mock task that will be returned
      const mockTask = createMockTask({
        userId,
        status: QuizGenerationStatus.IN_PROGRESS,
      });

      // And the use case will return success
      createTaskUseCase.execute.mockResolvedValue({
        quizGenerationTask: mockTask,
      });

      // When creating a file upload task without an extension
      await service.createTask(createDto);

      // Then the use case should be called with undefined filePath
      expect(createTaskUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          text,
          isFileUpload: true,
          filePath: undefined,
          bucketName: 'test-bucket',
        }),
      );
    });
  });

  describe('getTaskById', () => {
    it('should return a task with questions and answers', async () => {
      // Given a task with questions and answers
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();

      // Create mock answers
      const mockAnswers = [
        createMockAnswer({ isCorrect: true }),
        createMockAnswer({ isCorrect: false }),
        createMockAnswer({ isCorrect: false }),
      ];

      // Create mock questions with answers
      const mockQuestions = [
        createMockQuestion({ answers: mockAnswers }),
        createMockQuestion({ answers: mockAnswers.slice(0, 2) }),
      ];

      // Create mock task with questions
      const mockTask = createMockTask({ questions: mockQuestions });

      // And the use case will return this task
      fetchTaskUseCase.execute.mockResolvedValue({ task: mockTask });

      // When fetching the task
      const result = await service.getTaskById(taskId, userId);

      // Then the response should match the expected structure
      expect(result).toEqual({
        id: mockTask.getId(),
        status: mockTask.getStatus(),
        title: mockTask.getTitle(),
        textContent: mockTask.getTextContent(),
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
              }),
            ]) as unknown as MockAnswer[],
          }),
        ]) as unknown as MockQuestion[],
      });
    });

    it('should handle domain errors appropriately', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // Test different error scenarios
      const errorScenarios = [
        {
          error: new TaskNotFoundError(`Task with ID ${taskId} not found`),
          expectedError: NotFoundException,
          expectedMessage: `Task with ID ${taskId} not found`,
        },
        {
          error: new UnauthorizedTaskAccessError(
            'User not authorized to access this task',
          ),
          expectedError: NotFoundException,
          expectedMessage: 'Quiz generation task not found',
        },
        {
          error: new UserNotFoundError(`User not found: ${userId}`),
          expectedError: BadRequestException,
          // Fix: Use the exact error message format from the service
          expectedMessage: `User with ID '${userId}' not found`,
        },
      ];

      // For each error scenario
      for (const scenario of errorScenarios) {
        // Given the use case will throw this error
        fetchTaskUseCase.execute.mockRejectedValueOnce(scenario.error);

        // When getting the task, Then the appropriate HTTP exception should be thrown
        const promise = service.getTaskById(taskId, userId);
        await expect(promise).rejects.toThrow(scenario.expectedError);
        await expect(promise).rejects.toThrow(scenario.expectedMessage);
      }
    });

    it('should log and propagate unknown errors', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // And an unexpected error that is not one of the domain-specific errors
      const unexpectedError = new Error('Unexpected database error');
      fetchTaskUseCase.execute.mockRejectedValue(unexpectedError);

      // And we spy on the logger
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When fetching the task, Then the error should be propagated
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        unexpectedError,
      );

      // And the error should be logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to get quiz generation task with id ${taskId}`,
        ),
        expect.any(String),
      );
    });
  });

  describe('fetchTasksByUserId', () => {
    it('should return paginated tasks with correct structure', async () => {
      // Given a user with tasks
      const userId = faker.string.uuid();

      // Create mock tasks with different question counts
      const mockTasks = [
        createMockTask({
          questions: [createMockQuestion(), createMockQuestion()],
        }),
        createMockTask({
          questions: [
            createMockQuestion(),
            createMockQuestion(),
            createMockQuestion(),
          ],
        }),
        createMockTask({ questions: [] }),
      ];

      // And pagination metadata
      const pagination = {
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
      };

      // And the use case will return these
      fetchTasksUseCase.execute.mockResolvedValue({
        tasks: mockTasks,
        pagination,
      });

      // When fetching tasks
      const result = await service.fetchTasksByUserId({
        userId,
        page: 2,
        limit: 10,
      });

      // Then the result should have the correct structure
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockTasks[0].getId(),
            status: mockTasks[0].getStatus(),
            title: mockTasks[0].getTitle(),
            questionsCount: 2,
          }),
          expect.objectContaining({
            id: mockTasks[1].getId(),
            questionsCount: 3,
          }),
          expect.objectContaining({
            id: mockTasks[2].getId(),
            questionsCount: 0,
          }),
        ]) as unknown as MockQuizGenerationTask[],
        meta: pagination,
      });
    });

    it('should use default pagination when not provided', async () => {
      // Given a user
      const userId = faker.string.uuid();

      // And the use case will return data
      fetchTasksUseCase.execute.mockResolvedValue({
        tasks: [createMockTask()],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });

      // When fetching tasks without pagination params
      await service.fetchTasksByUserId({ userId });

      // Then default pagination should be used
      expect(fetchTasksUseCase.execute).toHaveBeenCalledWith({
        userId,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should convert UserNotFoundError to BadRequestException', async () => {
      // Given a non-existent user
      const userId = faker.string.uuid();
      fetchTasksUseCase.execute.mockRejectedValue(
        new UserNotFoundError(`User not found: ${userId}`),
      );

      // When fetching tasks, Then the error should be converted to BadRequestException
      await expect(service.fetchTasksByUserId({ userId })).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.fetchTasksByUserId({ userId })).rejects.toThrow(
        `User with ID '${userId}' not found`,
      );
    });

    it('should log and propagate unknown errors', async () => {
      // Given a user ID
      const userId = faker.string.uuid();

      // And an unexpected error that is not UserNotFoundError
      const unexpectedError = new Error('Database connection timeout');
      fetchTasksUseCase.execute.mockRejectedValue(unexpectedError);

      // And we spy on the logger
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When fetching tasks, Then the error should be propagated
      await expect(service.fetchTasksByUserId({ userId })).rejects.toThrow(
        unexpectedError,
      );

      // And the error should be logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch quiz generation tasks'),
        expect.any(String),
      );
    });
  });

  describe('deleteTask', () => {
    it('should successfully delete a task and return success response', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // And the use case will return success
      deleteTaskUseCase.execute.mockResolvedValue({ success: true });

      // When deleting the task
      const result = await service.deleteTask(taskId, userId);

      // Then the result should indicate success
      expect(result).toEqual({ success: true });
    });

    it('should convert domain errors to appropriate HTTP exceptions', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // Test different error scenarios
      const errorScenarios = [
        {
          error: new TaskNotFoundError(`Task not found: ${taskId}`),
          expectedError: NotFoundException,
          expectedMessage: `Task not found: ${taskId}`,
        },
        {
          error: new UnauthorizedTaskAccessError('User not authorized'),
          expectedError: NotFoundException,
          expectedMessage: 'Quiz generation task not found',
        },
        {
          error: new UserNotFoundError(`User not found: ${userId}`),
          expectedError: BadRequestException,
          expectedMessage: `User with ID '${userId}' not found`,
        },
      ];

      // Test each error scenario
      for (const scenario of errorScenarios) {
        // Given the use case will throw this error
        deleteTaskUseCase.execute.mockRejectedValueOnce(scenario.error);

        // When deleting the task, Then the expected HTTP exception should be thrown
        const promise = service.deleteTask(taskId, userId);
        await expect(promise).rejects.toThrow(scenario.expectedError);
        await expect(promise).rejects.toThrow(scenario.expectedMessage);
      }
    });

    it('should log unexpected errors during deletion', async () => {
      // Given an unexpected error
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();
      const unexpectedError = new Error('Database connection lost');

      // And the use case will throw this error
      deleteTaskUseCase.execute.mockRejectedValue(unexpectedError);

      // And we spy on the logger
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When deleting the task, Then the error should be propagated
      await expect(service.deleteTask(taskId, userId)).rejects.toThrow(
        unexpectedError,
      );

      // And the error should be logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to delete quiz generation task with id ${taskId}`,
        ),
        expect.any(String),
      );
    });

    it('should handle and log errors that are not Error instances', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // Non-Error type errors that could occur
      const nonErrorValues = [
        'string error',
        123,
        { message: 'Object error' },
        null,
        undefined,
      ];

      // Test each non-Error value
      for (const nonErrorValue of nonErrorValues) {
        // Given the use case will throw this non-Error value
        deleteTaskUseCase.execute.mockRejectedValueOnce(nonErrorValue);

        // And we spy on the logger
        const logSpy = jest.spyOn(Logger.prototype, 'error');

        // When deleting the task, Then the error should be propagated
        await expect(service.deleteTask(taskId, userId)).rejects.toBe(
          nonErrorValue,
        );

        // And the error should be logged as an unknown error type
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `Failed to delete quiz generation task with id ${taskId}: Unknown error type`,
          ),
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          String(nonErrorValue),
        );

        // Reset the spy
        logSpy.mockClear();
      }
    });
  });

  describe('resumeTask', () => {
    it('should resume a task successfully after file upload', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // And a mock task that will be returned
      const mockTask = createMockTask({
        userId,
        status: QuizGenerationStatus.COMPLETED,
        questions: [createMockQuestion(), createMockQuestion()],
      });

      // And the use case will return success with the task
      resumeTaskUseCase.execute.mockResolvedValue({
        success: true,
        task: mockTask,
      });

      // When resuming the task
      const result = await service.resumeTask(taskId, userId);

      // Then the result should indicate success with the task details
      expect(result).toEqual({
        success: true,
        task: expect.objectContaining({
          id: mockTask.getId(),
          status: mockTask.getStatus(),
          textContent: mockTask.getTextContent(),
          questions: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              text: expect.any(String),
            }),
          ]),
        }),
      });

      // And the use case should be called with correct parameters
      expect(resumeTaskUseCase.execute).toHaveBeenCalledWith({
        taskId,
        userId,
      });
    });

    it('should handle domain errors appropriately when resuming a task', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // Test different error scenarios
      const errorScenarios = [
        {
          error: new TaskNotFoundError(`Task not found: ${taskId}`),
          expectedError: NotFoundException,
          expectedMessage: `Task not found: ${taskId}`,
        },
        {
          error: new UnauthorizedTaskAccessError('User not authorized'),
          expectedError: NotFoundException,
          expectedMessage: 'Quiz generation task not found',
        },
        {
          error: new UserNotFoundError(`User not found: ${userId}`),
          expectedError: BadRequestException,
          expectedMessage: `User with ID '${userId}' not found`,
        },
      ];

      // For each error scenario
      for (const scenario of errorScenarios) {
        // Given the use case will throw this error
        resumeTaskUseCase.execute.mockRejectedValueOnce(scenario.error);

        // When resuming the task, Then the appropriate HTTP exception should be thrown
        const promise = service.resumeTask(taskId, userId);
        await expect(promise).rejects.toThrow(scenario.expectedError);
        await expect(promise).rejects.toThrow(scenario.expectedMessage);
      }
    });

    it('should log and propagate unknown errors during task resumption', async () => {
      // Given a task ID and user ID
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();

      // And an unexpected error
      const unexpectedError = new Error('OCR service unavailable');
      resumeTaskUseCase.execute.mockRejectedValue(unexpectedError);

      // And we spy on the logger
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When resuming the task, Then the error should be propagated
      await expect(service.resumeTask(taskId, userId)).rejects.toThrow(
        unexpectedError,
      );

      // And the error should be logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Failed to resume quiz generation task with id ${taskId}`,
        ),
        expect.any(String),
      );
    });
  });

  describe('fetchOngoingTasksByUserId', () => {
    it('should return only ongoing tasks (PENDING or IN_PROGRESS) for a user', async () => {
      // Given a user with ongoing tasks
      const userId = faker.string.uuid();

      // Create mock tasks with different statuses
      const mockPendingTask = createMockTask({
        status: QuizGenerationStatus.PENDING,
        questions: [createMockQuestion()],
      });

      const mockInProgressTask = createMockTask({
        status: QuizGenerationStatus.IN_PROGRESS,
        questions: [createMockQuestion(), createMockQuestion()],
      });

      const mockOngoingTasks = [mockPendingTask, mockInProgressTask];

      // And the use case will return these ongoing tasks
      fetchOngoingTasksUseCase.execute.mockResolvedValue({
        tasks: mockOngoingTasks,
      });

      // When fetching ongoing tasks
      const result = await service.fetchOngoingTasksByUserId(userId);

      // Then the result should contain only the ongoing tasks with correct structure
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: mockPendingTask.getId(),
            status: QuizGenerationStatus.PENDING,
            questionsCount: 1,
          }),
          expect.objectContaining({
            id: mockInProgressTask.getId(),
            status: QuizGenerationStatus.IN_PROGRESS,
            questionsCount: 2,
          }),
        ]),
      );

      // And the use case should be called with the correct userId
      expect(fetchOngoingTasksUseCase.execute).toHaveBeenCalledWith({ userId });
    });

    it('should return empty array when user has no ongoing tasks', async () => {
      // Given a user with no ongoing tasks
      const userId = faker.string.uuid();

      // And the use case will return an empty array
      fetchOngoingTasksUseCase.execute.mockResolvedValue({ tasks: [] });

      // When fetching ongoing tasks
      const result = await service.fetchOngoingTasksByUserId(userId);

      // Then the result should be an empty array
      expect(result).toEqual([]);

      // And the use case should be called with the correct userId
      expect(fetchOngoingTasksUseCase.execute).toHaveBeenCalledWith({ userId });
    });

    it('should convert UserNotFoundError to BadRequestException', async () => {
      // Given a non-existent user
      const userId = faker.string.uuid();

      // And the use case will throw a UserNotFoundError
      fetchOngoingTasksUseCase.execute.mockRejectedValue(
        new UserNotFoundError(`User not found: ${userId}`),
      );

      // When fetching ongoing tasks
      // Then the error should be converted to BadRequestException
      await expect(service.fetchOngoingTasksByUserId(userId)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.fetchOngoingTasksByUserId(userId)).rejects.toThrow(
        `User with ID '${userId}' not found`,
      );
    });

    it('should log and propagate unknown errors', async () => {
      // Given a user ID
      const userId = faker.string.uuid();

      // And an unexpected error
      const unexpectedError = new Error('Database connection error');
      fetchOngoingTasksUseCase.execute.mockRejectedValue(unexpectedError);

      // And we spy on the logger
      const logSpy = jest.spyOn(Logger.prototype, 'error');

      // When fetching ongoing tasks
      // Then the error should be propagated
      await expect(service.fetchOngoingTasksByUserId(userId)).rejects.toThrow(
        unexpectedError,
      );

      // And the error should be logged
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch quiz generation tasks'),
        expect.any(String),
      );
    });
  });
});
