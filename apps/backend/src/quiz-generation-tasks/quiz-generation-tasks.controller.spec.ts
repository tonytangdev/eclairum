import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { FetchQuizGenerationTasksDto } from './dto/fetch-quiz-generation-tasks.dto';
import { QuizGenerationStatus } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import {
  TaskResponse,
  TaskSummaryResponse,
} from './dto/fetch-quiz-generation-tasks.response.dto';
import { ResumeQuizGenerationTaskDto } from './dto/resume-quiz-generation-task.dto';
import { TaskDetailResponse } from './dto/fetch-quiz-generation-task.response.dto';

describe('QuizGenerationTasksController', () => {
  let controller: QuizGenerationTasksController;

  // Define a proper type for the service mock that includes all methods we use
  let serviceMock: {
    createTask: jest.Mock;
    fetchTasksByUserId: jest.Mock;
    getTaskById: jest.Mock;
    deleteTask: jest.Mock;
    resumeTask: jest.Mock;
    fetchOngoingTasksByUserId: jest.Mock;
  };

  // Test data generators
  const generateUserId = () => faker.string.uuid();

  const generateCreateTaskDto = (
    userId = generateUserId(),
  ): CreateQuizGenerationTaskDto => ({
    text: faker.lorem.paragraphs(2),
    userId,
  });

  const generateTaskResponse = (
    userId: string,
    questionsCount = 3,
  ): TaskResponse => ({
    taskId: faker.string.uuid(),
    userId,
    status: QuizGenerationStatus.COMPLETED,
    questionsCount,
    message: `Quiz generation task created with ${questionsCount} questions`,
    generatedAt: new Date(),
  });

  const generateTaskSummary = (
    status: QuizGenerationStatus,
    questionsCount = 0,
  ): TaskSummaryResponse => ({
    id: faker.string.uuid(),
    status,
    title: faker.lorem.sentence(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    questionsCount,
  });

  const generatePaginatedResponse = (userId: string, itemsCount = 1) => ({
    data: Array(itemsCount)
      .fill(null)
      .map(() => ({
        id: faker.string.uuid(),
        status: QuizGenerationStatus.COMPLETED,
        title: faker.lorem.sentence(),
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent(),
        questionsCount: faker.number.int({ min: 1, max: 10 }),
      })),
    meta: {
      page: 1,
      limit: 10,
      totalItems: itemsCount,
      totalPages: Math.ceil(itemsCount / 10),
    },
  });

  beforeEach(async () => {
    // Create service mock with explicit implementation of all required methods
    serviceMock = {
      createTask: jest.fn(),
      fetchTasksByUserId: jest.fn(),
      getTaskById: jest.fn(),
      deleteTask: jest.fn(),
      resumeTask: jest.fn(),
      fetchOngoingTasksByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizGenerationTasksController],
      providers: [
        {
          provide: QuizGenerationTasksService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<QuizGenerationTasksController>(
      QuizGenerationTasksController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createQuizGenerationTask', () => {
    it('should successfully create a quiz generation task', async () => {
      // Given
      const createDto = generateCreateTaskDto();
      const expectedResponse = generateTaskResponse(createDto.userId);
      serviceMock.createTask.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.createQuizGenerationTask(createDto);

      // Then
      expect(serviceMock.createTask).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from the service', async () => {
      // Given
      const createDto = generateCreateTaskDto();
      const errorMessage = 'Failed to generate quiz';
      serviceMock.createTask.mockRejectedValue(new Error(errorMessage));

      // When/Then
      await expect(
        controller.createQuizGenerationTask(createDto),
      ).rejects.toThrow(errorMessage);
    });

    it('should use HTTP 201 Created status code', () => {
      // Given/When
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpCodeMetadata = Reflect.getMetadata(
        '__httpCode__',
        controller.createQuizGenerationTask,
      );

      // Then
      expect(httpCodeMetadata).toBe(HttpStatus.CREATED);
    });
  });

  describe('fetchQuizGenerationTasks', () => {
    it('should return paginated quiz generation tasks', async () => {
      // Given
      const userId = generateUserId();
      const queryParams: FetchQuizGenerationTasksDto = { userId };
      const expectedResponse = generatePaginatedResponse(userId, 3);
      serviceMock.fetchTasksByUserId.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.fetchQuizGenerationTasks(queryParams);

      // Then
      expect(serviceMock.fetchTasksByUserId).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle pagination parameters', async () => {
      // Given
      const userId = generateUserId();
      const queryParams: FetchQuizGenerationTasksDto = {
        userId,
        page: 2,
        limit: 5,
      };
      const expectedResponse = generatePaginatedResponse(userId, 8);
      expectedResponse.meta.page = 2;
      expectedResponse.meta.limit = 5;
      serviceMock.fetchTasksByUserId.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.fetchQuizGenerationTasks(queryParams);

      // Then
      expect(serviceMock.fetchTasksByUserId).toHaveBeenCalledWith(queryParams);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
    });

    it('should propagate errors from the service', async () => {
      // Given
      const userId = generateUserId();
      const errorMessage = 'Failed to fetch tasks';
      serviceMock.fetchTasksByUserId.mockRejectedValue(new Error(errorMessage));

      // When/Then
      await expect(
        controller.fetchQuizGenerationTasks({ userId }),
      ).rejects.toThrow(errorMessage);
    });

    it('should use HTTP 200 OK status code', () => {
      // Given/When
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpCodeMetadata = Reflect.getMetadata(
        '__httpCode__',
        controller.fetchQuizGenerationTasks,
      );

      // Then
      expect(httpCodeMetadata).toBe(HttpStatus.OK);
    });
  });

  describe('fetchOngoingQuizGenerationTasks', () => {
    it('should return ongoing quiz generation tasks for a user', async () => {
      // Given
      const userId = generateUserId();
      const pendingTask = generateTaskSummary(QuizGenerationStatus.PENDING);
      const inProgressTask = generateTaskSummary(
        QuizGenerationStatus.IN_PROGRESS,
        2,
      );
      const expectedTasks = [pendingTask, inProgressTask];

      serviceMock.fetchOngoingTasksByUserId.mockResolvedValue(expectedTasks);

      // When
      const result = await controller.fetchOngoingQuizGenerationTasks(userId);

      // Then
      expect(serviceMock.fetchOngoingTasksByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(expectedTasks);
      expect(result).toHaveLength(2);
    });

    it('should return an empty array when user has no ongoing tasks', async () => {
      // Given
      const userId = generateUserId();
      serviceMock.fetchOngoingTasksByUserId.mockResolvedValue([]);

      // When
      const result = await controller.fetchOngoingQuizGenerationTasks(userId);

      // Then
      expect(serviceMock.fetchOngoingTasksByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual([]);
    });

    it('should propagate errors from the service', async () => {
      // Given
      const userId = generateUserId();
      const errorMessage = 'Failed to fetch ongoing tasks';
      serviceMock.fetchOngoingTasksByUserId.mockRejectedValue(
        new Error(errorMessage),
      );

      // When/Then
      await expect(
        controller.fetchOngoingQuizGenerationTasks(userId),
      ).rejects.toThrow(errorMessage);
    });

    it('should use HTTP 200 OK status code', () => {
      // Given/When
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpCodeMetadata = Reflect.getMetadata(
        '__httpCode__',
        controller.fetchOngoingQuizGenerationTasks,
      );

      // Then
      expect(httpCodeMetadata).toBe(HttpStatus.OK);
    });
  });

  describe('getQuizGenerationTask', () => {
    it('should fetch a single quiz generation task by ID', async () => {
      // Given
      const taskId = faker.string.uuid();
      const userId = generateUserId();
      const expectedResponse = {
        id: taskId,
        status: QuizGenerationStatus.COMPLETED,
        title: faker.lorem.sentence(),
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent(),
        generatedAt: faker.date.recent(),
        questions: Array(3)
          .fill(null)
          .map(() => ({
            id: faker.string.uuid(),
            text: faker.lorem.sentence(),
            answers: Array(4)
              .fill(null)
              .map((_, idx) => ({
                id: faker.string.uuid(),
                text: faker.lorem.sentence(),
                isCorrect: idx === 0,
              })),
          })),
      };

      serviceMock.getTaskById.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.getQuizGenerationTask(taskId, { userId });

      // Then
      expect(serviceMock.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors when fetching a specific task', async () => {
      // Given
      const taskId = faker.string.uuid();
      const userId = generateUserId();
      const errorMessage = 'Task not found';
      serviceMock.getTaskById.mockRejectedValue(new Error(errorMessage));

      // When/Then
      await expect(
        controller.getQuizGenerationTask(taskId, { userId }),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('deleteQuizGenerationTask', () => {
    it('should successfully delete a quiz generation task', async () => {
      // Given
      const taskId = faker.string.uuid();
      const userId = generateUserId();
      const expectedResponse = { success: true };
      serviceMock.deleteTask.mockResolvedValue(expectedResponse);

      // When
      const result = await controller.deleteQuizGenerationTask(taskId, {
        userId,
      });

      // Then
      expect(serviceMock.deleteTask).toHaveBeenCalledWith(taskId, userId);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors when deleting a task', async () => {
      // Given
      const taskId = faker.string.uuid();
      const userId = generateUserId();
      const errorMessage = 'Failed to delete task';
      serviceMock.deleteTask.mockRejectedValue(new Error(errorMessage));

      // When/Then
      await expect(
        controller.deleteQuizGenerationTask(taskId, { userId }),
      ).rejects.toThrow(errorMessage);
    });

    it('should use HTTP 200 OK status code', () => {
      // Given/When
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpCodeMetadata = Reflect.getMetadata(
        '__httpCode__',
        controller.deleteQuizGenerationTask,
      );

      // Then
      expect(httpCodeMetadata).toBe(HttpStatus.OK);
    });
  });

  describe('resumeQuizGenerationTask', () => {
    it('should resume a task and return the result', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();
      const resumeDto = new ResumeQuizGenerationTaskDto();
      resumeDto.userId = userId;

      const mockTaskDetail: TaskDetailResponse = {
        id: taskId,
        status: 'IN_PROGRESS',
        title: 'Sample Title',
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedAt: null,
        textContent: 'Sample text content',
        questions: [],
      };

      const expectedResult = {
        success: true,
        task: mockTaskDetail,
      };

      serviceMock.resumeTask.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.resumeQuizGenerationTask(
        taskId,
        resumeDto,
      );

      // Assert
      expect(result).toBe(expectedResult);
      expect(serviceMock.resumeTask).toHaveBeenCalledWith(taskId, userId);
      expect(serviceMock.resumeTask).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from the service', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const userId = faker.string.uuid();
      const resumeDto = new ResumeQuizGenerationTaskDto();
      resumeDto.userId = userId;

      const error = new Error('Failed to resume task');
      serviceMock.resumeTask.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.resumeQuizGenerationTask(taskId, resumeDto),
      ).rejects.toThrow(error);
    });

    it('should use HTTP 202 Accepted status code', () => {
      // Arrange & Act
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpCodeMetadata = Reflect.getMetadata(
        '__httpCode__',
        controller.resumeQuizGenerationTask,
      );

      // Assert
      expect(httpCodeMetadata).toBe(HttpStatus.ACCEPTED);
    });
  });
});
