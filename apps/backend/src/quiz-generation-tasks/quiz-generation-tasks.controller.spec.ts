import { Test, TestingModule } from '@nestjs/testing';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { faker } from '@faker-js/faker';
import { QuizGenerationStatus } from '@eclairum/core/entities';
import { HttpStatus } from '@nestjs/common';
import { FetchQuizGenerationTasksDto } from './dto/fetch-quiz-generation-tasks.dto';
import { PaginatedTasksResponse } from '../dtos';

describe('QuizGenerationTasksController', () => {
  let controller: QuizGenerationTasksController;
  let service: QuizGenerationTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizGenerationTasksController],
      providers: [
        {
          provide: QuizGenerationTasksService,
          useValue: {
            createTask: jest
              .fn()
              .mockImplementation(async (dto: CreateQuizGenerationTaskDto) => {
                return Promise.resolve({
                  taskId: faker.string.uuid(),
                  userId: dto.userId,
                  status: QuizGenerationStatus.COMPLETED,
                  questionsCount: 3,
                  message: 'Quiz generation task created with 3 questions',
                  generatedAt: new Date(),
                });
              }),
            fetchTasksByUserId: jest
              .fn()
              .mockImplementation(async (dto: FetchQuizGenerationTasksDto) => {
                // Return a properly formatted paginated response
                return Promise.resolve({
                  data: [
                    {
                      taskId: faker.string.uuid(),
                      userId: dto.userId,
                      status: QuizGenerationStatus.COMPLETED,
                      questionsCount: 3,
                      message: 'Quiz generation task completed',
                      generatedAt: new Date(),
                    },
                  ],
                  meta: {
                    page: 1,
                    limit: 10,
                    totalItems: 1,
                    totalPages: 1,
                  },
                });
              }),
          },
        },
      ],
    }).compile();

    controller = module.get<QuizGenerationTasksController>(
      QuizGenerationTasksController,
    );
    service = module.get<QuizGenerationTasksService>(
      QuizGenerationTasksService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createQuizGenerationTask', () => {
    it('should call service.createTask with correct parameters', async () => {
      // Arrange
      const dto: CreateQuizGenerationTaskDto = {
        text: faker.lorem.paragraphs(2),
        userId: faker.string.uuid(),
      };

      // Act
      await controller.createQuizGenerationTask(dto);

      // Assert
      expect(service.createTask).toHaveBeenCalledWith(dto);
    });

    it('should return the result from the service', async () => {
      // Arrange
      const dto: CreateQuizGenerationTaskDto = {
        text: faker.lorem.paragraphs(2),
        userId: faker.string.uuid(),
      };

      const expectedResult = {
        taskId: faker.string.uuid(),
        userId: dto.userId,
        status: QuizGenerationStatus.COMPLETED,
        questionsCount: 3,
        message: 'Quiz generation task created with 3 questions',
        generatedAt: new Date(),
      };

      jest.spyOn(service, 'createTask').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.createQuizGenerationTask(dto);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors correctly', async () => {
      // Arrange
      const dto: CreateQuizGenerationTaskDto = {
        text: faker.lorem.paragraphs(2),
        userId: faker.string.uuid(),
      };

      const errorMessage = `Failed to generate quiz: ${faker.lorem.sentence()}`;
      jest
        .spyOn(service, 'createTask')
        .mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.createQuizGenerationTask(dto)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should use HttpCode(202) decorator for Accepted status', () => {
      // Get metadata to verify the HTTP status code decorator
      const metadata = Reflect.getMetadata(
        '__httpCode__',
        controller.createQuizGenerationTask,
      ) as number;

      expect(metadata).toBe(HttpStatus.ACCEPTED);
    });
  });

  describe('fetchQuizGenerationTasks', () => {
    it('should call service.fetchTasksByUserId with correct parameters', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const queryParams: FetchQuizGenerationTasksDto = { userId };

      // Act
      await controller.fetchQuizGenerationTasks(queryParams);

      // Assert
      expect(service.fetchTasksByUserId).toHaveBeenCalledWith({ userId });
    });

    it('should return the result from the service', async () => {
      // Arrange
      const dto: FetchQuizGenerationTasksDto = {
        userId: faker.string.uuid(),
      };

      const expectedResult: PaginatedTasksResponse = {
        data: [
          {
            id: faker.string.uuid(),
            status: QuizGenerationStatus.COMPLETED,
            title: 'Sample Quiz',
            createdAt: new Date(),
            updatedAt: new Date(),
            questionsCount: 3,
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };

      jest
        .spyOn(service, 'fetchTasksByUserId')
        .mockResolvedValue(expectedResult);

      // Act
      const result = await controller.fetchQuizGenerationTasks(dto);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors correctly', async () => {
      // Arrange
      const dto: FetchQuizGenerationTasksDto = {
        userId: faker.string.uuid(),
      };

      const errorMessage = `Failed to fetch quiz generation tasks: ${faker.lorem.sentence()}`;
      jest
        .spyOn(service, 'fetchTasksByUserId')
        .mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.fetchQuizGenerationTasks(dto)).rejects.toThrow(
        errorMessage,
      );
    });

    it('should use HttpCode(200) decorator for OK status', () => {
      // Get metadata to verify the HTTP status code decorator
      const metadata = Reflect.getMetadata(
        '__httpCode__',
        controller.fetchQuizGenerationTasks,
      ) as number;

      expect(metadata).toBe(HttpStatus.OK);
    });
  });
});
