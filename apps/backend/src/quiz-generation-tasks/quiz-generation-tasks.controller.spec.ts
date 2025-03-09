import { Test, TestingModule } from '@nestjs/testing';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { faker } from '@faker-js/faker';
import { QuizGenerationStatus } from '@flash-me/core/entities';
import { HttpStatus } from '@nestjs/common';

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
          },
        },
      ],
    }).compile();

    controller = module.get<QuizGenerationTasksController>(
      QuizGenerationTasksController,
    );
    service = module.get<QuizGenerationTasksService>(QuizGenerationTasksService);
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
});
