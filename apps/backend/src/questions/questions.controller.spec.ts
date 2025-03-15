import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './services/questions.service';
import { faker } from '@faker-js/faker';

describe('QuestionsController', () => {
  let controller: QuestionsController;

  // Mock the QuestionsService
  const mockQuestionsService = {
    getQuestions: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: mockQuestionsService,
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuestions', () => {
    it('should return questions for a user without limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockQuestions = Array.from({ length: 5 }, () => ({
        id: faker.string.uuid(),
        text: faker.lorem.sentence(),
        userId,
      }));
      mockQuestionsService.getQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.getQuestions(userId);

      // Assert
      expect(result).toBe(mockQuestions);
      expect(mockQuestionsService.getQuestions).toHaveBeenCalledWith(
        userId,
        undefined,
      );
    });

    it('should return questions for a user with limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const limit = faker.number.int({ min: 1, max: 10 });
      const mockQuestions = Array.from({ length: limit }, () => ({
        id: faker.string.uuid(),
        text: faker.lorem.sentence(),
        userId,
      }));
      mockQuestionsService.getQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.getQuestions(userId, limit);

      // Assert
      expect(result).toBe(mockQuestions);
      expect(mockQuestionsService.getQuestions).toHaveBeenCalledWith(
        userId,
        limit,
      );
    });
  });
});
