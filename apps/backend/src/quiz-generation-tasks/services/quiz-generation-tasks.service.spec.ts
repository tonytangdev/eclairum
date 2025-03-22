/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test } from '@nestjs/testing';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
  Question,
  Answer,
} from '@eclairum/core/entities';
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
  CreateQuizGenerationTaskUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
  FetchQuizGenerationTasksForUserUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
  FetchQuizGenerationTaskForUserUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn(),
  })),
  SoftDeleteQuizGenerationTaskForUserUseCase: jest
    .fn()
    .mockImplementation(() => ({
      execute: jest.fn(),
    })),
}));

// Import use cases after mocking
import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTasksForUserUseCase,
  FetchQuizGenerationTaskForUserUseCase,
  SoftDeleteQuizGenerationTaskForUserUseCase,
} from '@eclairum/core/use-cases';

describe('QuizGenerationTasksService', () => {
  let service: QuizGenerationTasksService;
  let mockUseCases: {
    createTask: jest.Mock;
    fetchTasks: jest.Mock;
    fetchTask: jest.Mock;
    deleteTask: jest.Mock;
  };
  let unitOfWorkService: jest.Mocked<UnitOfWorkService>;

  // Create test data functions - using proper constructors
  const createTestAnswer = (props: {
    id?: string;
    content?: string;
    isCorrect?: boolean;
    questionId?: string;
  }): Answer => {
    return new Answer({
      id: props.id || faker.string.uuid(),
      content: props.content || faker.lorem.sentence(),
      isCorrect:
        props.isCorrect !== undefined
          ? props.isCorrect
          : faker.datatype.boolean(),
      questionId: props.questionId || faker.string.uuid(),
    });
  };

  const createTestQuestion = (props: {
    id?: string;
    content?: string;
    answers?: Answer[];
    taskId?: string;
  }): Question => {
    return new Question({
      id: props.id || faker.string.uuid(),
      content: props.content || faker.lorem.sentence(),
      answers: props.answers || [],
      quizGenerationTaskId: props.taskId || faker.string.uuid(),
    });
  };

  const createTestTask = (props: {
    id?: string;
    userId?: string;
    status?: QuizGenerationStatus;
    questions?: Question[];
    title?: string;
    textContent?: string;
  }): QuizGenerationTask => {
    return new QuizGenerationTask({
      id: props.id || faker.string.uuid(),
      textContent: props.textContent || faker.lorem.paragraphs(2),
      status: props.status || QuizGenerationStatus.COMPLETED,
      questions: props.questions || [],
      userId: props.userId || faker.string.uuid(),
      title: props.title || faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedAt: new Date(),
    });
  };

  // Complex test data builder function
  const buildCompleteTask = (
    options: {
      userId?: string;
      questionCount?: number;
      answersPerQuestion?: number;
      status?: QuizGenerationStatus;
    } = {},
  ): QuizGenerationTask => {
    const {
      userId = faker.string.uuid(),
      questionCount = 3,
      answersPerQuestion = 4,
      status = QuizGenerationStatus.COMPLETED,
    } = options;

    const taskId = faker.string.uuid();

    // Create questions with answers
    const questions: Question[] = [];

    for (let i = 0; i < questionCount; i++) {
      const questionId = faker.string.uuid();
      const answers: Answer[] = [];

      // Create answers (first is correct)
      for (let j = 0; j < answersPerQuestion; j++) {
        answers.push(
          createTestAnswer({
            questionId,
            isCorrect: j === 0,
          }),
        );
      }

      questions.push(
        createTestQuestion({
          id: questionId,
          taskId,
          answers,
        }),
      );
    }

    return createTestTask({
      id: taskId,
      userId,
      status,
      questions,
    });
  };

  // Create quiz generation DTO
  const createQuizGenerationDto = (
    props: {
      text?: string;
      userId?: string;
    } = {},
  ) => ({
    text: props.text || faker.lorem.paragraphs(3),
    userId: props.userId || faker.string.uuid(),
  });

  beforeEach(async () => {
    // Create mock repositories and services
    const mockQuestionRepo = {};
    const mockAnswerRepo = {};
    const mockTaskRepo = {};
    const mockLlmService = { generateQuiz: jest.fn() };
    const mockUserRepo = { findById: jest.fn() };

    // Mock the use case instances
    const mockCreateUseCase = { execute: jest.fn() };
    const mockFetchTasksUseCase = { execute: jest.fn() };
    const mockFetchTaskUseCase = { execute: jest.fn() };
    const mockDeleteTaskUseCase = { execute: jest.fn() };

    // Set up for mocking use case factory
    mockUseCases = {
      createTask: mockCreateUseCase.execute,
      fetchTasks: mockFetchTasksUseCase.execute,
      fetchTask: mockFetchTaskUseCase.execute,
      deleteTask: mockDeleteTaskUseCase.execute,
    };

    // Set up use case factory mocks
    (CreateQuizGenerationTaskUseCase as jest.Mock).mockReturnValue(
      mockCreateUseCase,
    );
    (FetchQuizGenerationTasksForUserUseCase as jest.Mock).mockReturnValue(
      mockFetchTasksUseCase,
    );
    (FetchQuizGenerationTaskForUserUseCase as jest.Mock).mockReturnValue(
      mockFetchTaskUseCase,
    );
    (SoftDeleteQuizGenerationTaskForUserUseCase as jest.Mock).mockReturnValue(
      mockDeleteTaskUseCase,
    );

    // Mock UnitOfWorkService
    unitOfWorkService = {
      getManager: jest.fn(),
      doTransactional: jest
        .fn()
        .mockImplementation(async (callback) => await callback()),
    } as unknown as jest.Mocked<UnitOfWorkService>;

    // Create the service with its dependencies
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuizGenerationTasksService,
        { provide: QuestionRepositoryImpl, useValue: mockQuestionRepo },
        { provide: AnswerRepositoryImpl, useValue: mockAnswerRepo },
        { provide: QuizGenerationTaskRepositoryImpl, useValue: mockTaskRepo },
        { provide: LLM_SERVICE_PROVIDER_KEY, useValue: mockLlmService },
        { provide: UserRepositoryImpl, useValue: mockUserRepo },
        { provide: UnitOfWorkService, useValue: unitOfWorkService },
      ],
    }).compile();

    service = moduleRef.get<QuizGenerationTasksService>(
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
    it('should successfully create a task and return expected response', async () => {
      // Given a quiz generation request
      const userId = faker.string.uuid();
      const quizDto = createQuizGenerationDto({ userId });

      // And a task that will be created
      const task = createTestTask({ userId });

      // And the create use case will return this task
      mockUseCases.createTask.mockResolvedValue({ quizGenerationTask: task });

      // When the service method is called
      const result = await service.createTask(quizDto);

      // Then the use case should be called with correct arguments
      expect(mockUseCases.createTask).toHaveBeenCalledWith({
        userId,
        text: quizDto.text,
      });

      // And the result should have the expected structure
      expect(result).toMatchObject({
        taskId: task.getId(),
        userId: task.getUserId(),
        status: task.getStatus(),
        message: expect.stringContaining('Quiz generation task created'),
      });
    });

    it('should return the correct question count for a task with questions', async () => {
      // Given a task with questions
      const userId = faker.string.uuid();
      const task = buildCompleteTask({
        userId,
        questionCount: 5,
      });

      // And the create use case will return this task
      mockUseCases.createTask.mockResolvedValue({ quizGenerationTask: task });

      // When the service method is called
      const result = await service.createTask(
        createQuizGenerationDto({ userId }),
      );

      // Then the response should include the right question count
      expect(result.questionsCount).toBe(5);
    });

    it('should handle and propagate use case errors', async () => {
      // Given a request that will cause an error
      const quizDto = createQuizGenerationDto();
      const error = new Error('Use case execution failed');
      mockUseCases.createTask.mockRejectedValue(error);

      // When the service method is called
      // Then it should propagate the error
      await expect(service.createTask(quizDto)).rejects.toThrow(error);
    });
  });

  describe('getTaskById', () => {
    it('should return a detailed task response when task exists', async () => {
      // Given a task with questions and answers
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const task = buildCompleteTask({ userId });

      // And the fetch task use case will return this task
      mockUseCases.fetchTask.mockResolvedValue({ task });

      // When getting the task by ID
      const result = await service.getTaskById(taskId, userId);

      // Then the use case should be called with correct parameters
      expect(mockUseCases.fetchTask).toHaveBeenCalledWith({
        userId,
        taskId,
      });

      // And the result should have the expected structure
      expect(result).toMatchObject({
        id: task.getId(),
        status: task.getStatus(),
        title: task.getTitle(),
        textContent: task.getTextContent(),
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

    it('should throw NotFoundException when task is not found', async () => {
      // Given a task that doesn't exist
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockUseCases.fetchTask.mockRejectedValue(
        new TaskNotFoundError(`Task with ID ${taskId} not found`),
      );

      // When getting the task by ID
      // Then a NotFoundException should be thrown
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mask unauthorized access as not found for security', async () => {
      // Given a task that belongs to a different user
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockUseCases.fetchTask.mockRejectedValue(
        new UnauthorizedTaskAccessError(
          'User not authorized to access this task',
        ),
      );

      // When getting the task by ID
      // Then a NotFoundException should be thrown with a generic message
      const requestPromise = service.getTaskById(taskId, userId);
      await expect(requestPromise).rejects.toThrow(NotFoundException);
      await expect(requestPromise).rejects.toThrow(
        'Quiz generation task not found',
      );
    });

    it('should throw BadRequestException when user is not found', async () => {
      // Given a non-existent user
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockUseCases.fetchTask.mockRejectedValue(
        new UserNotFoundError(`User with ID ${userId} not found`),
      );

      // When getting the task by ID
      // Then a BadRequestException should be thrown
      await expect(service.getTaskById(taskId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('fetchTasksByUserId', () => {
    it('should return paginated tasks with metadata', async () => {
      // Given a user with tasks
      const userId = faker.string.uuid();
      const tasks = [createTestTask({ userId }), createTestTask({ userId })];

      // And pagination information
      const pagination = {
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
      };

      // And the use case will return these tasks with pagination
      mockUseCases.fetchTasks.mockResolvedValue({ tasks, pagination });

      // When fetching tasks for this user
      const result = await service.fetchTasksByUserId({
        userId,
        page: 2,
        limit: 10,
      });

      // Then the use case should be called with correct parameters
      expect(mockUseCases.fetchTasks).toHaveBeenCalledWith({
        userId,
        pagination: { page: 2, limit: 10 },
      });

      // And the result should have the expected structure
      expect(result).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            status: expect.any(String),
            title: expect.any(String),
          }),
        ]),
        meta: pagination,
      });
    });

    it('should use default pagination when none is provided', async () => {
      // Given a user with tasks
      const userId = faker.string.uuid();

      // Add missing mock response
      mockUseCases.fetchTasks.mockResolvedValue({
        tasks: [createTestTask({ userId })],
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
      expect(mockUseCases.fetchTasks).toHaveBeenCalledWith({
        userId,
        pagination: { page: 1, limit: 10 },
      });
    });

    it('should handle empty result sets appropriately', async () => {
      // Given a user with no tasks
      const userId = faker.string.uuid();
      mockUseCases.fetchTasks.mockResolvedValue({
        tasks: [],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
        },
      });

      // When fetching tasks for this user
      const result = await service.fetchTasksByUserId({ userId });

      // Then an empty data array should be returned
      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });

    it('should throw BadRequestException when user is not found', async () => {
      // Given a non-existent user
      const userId = faker.string.uuid();
      mockUseCases.fetchTasks.mockRejectedValue(
        new UserNotFoundError(`User with ID ${userId} not found`),
      );

      // When fetching tasks for this user
      // Then a BadRequestException should be thrown
      await expect(service.fetchTasksByUserId({ userId })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteTask', () => {
    it('should successfully delete a task', async () => {
      // Given a task that can be deleted
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockUseCases.deleteTask.mockResolvedValue({ success: true });

      // When deleting the task
      const result = await service.deleteTask(taskId, userId);

      // Then the operation should succeed
      expect(mockUseCases.deleteTask).toHaveBeenCalledWith({
        userId,
        taskId,
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when task is not found', async () => {
      // Given a task that doesn't exist
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockUseCases.deleteTask.mockRejectedValue(
        new TaskNotFoundError(`Task with ID ${taskId} not found`),
      );

      // When deleting the task
      // Then a NotFoundException should be thrown
      await expect(service.deleteTask(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle unauthorized deletion attempts securely', async () => {
      // Given a task that belongs to another user
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      mockUseCases.deleteTask.mockRejectedValue(
        new UnauthorizedTaskAccessError(
          'User not authorized to delete this task',
        ),
      );

      // When deleting the task
      // Then a NotFoundException should be thrown to mask the real reason
      await expect(service.deleteTask(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate unexpected errors and log them', async () => {
      // Given an unexpected error
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const error = new Error('Unexpected database error');
      mockUseCases.deleteTask.mockRejectedValue(error);

      // When deleting the task
      // Then the error should be propagated
      await expect(service.deleteTask(taskId, userId)).rejects.toThrow(error);
    });
  });
});
