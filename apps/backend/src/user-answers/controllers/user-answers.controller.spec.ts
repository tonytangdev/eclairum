import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserAnswersController } from './user-answers.controller';
import { UserAnswersService } from '../services/user-answers.service';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { faker } from '@faker-js/faker';

describe('UserAnswersController', () => {
  let controller: UserAnswersController;
  let service: jest.Mocked<UserAnswersService>;

  const mockSubmitAnswerDto: SubmitAnswerDto = {
    userId: faker.string.alphanumeric(10),
    questionId: faker.string.uuid(),
    answerId: faker.string.uuid(),
  };

  beforeEach(async () => {
    // Create a mock service implementation
    const mockUserAnswersService = {
      submitAnswer: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAnswersController],
      providers: [
        {
          provide: UserAnswersService,
          useValue: mockUserAnswersService,
        },
      ],
    }).compile();

    controller = module.get<UserAnswersController>(UserAnswersController);
    service = module.get<UserAnswersService>(
      UserAnswersService,
    ) as jest.Mocked<UserAnswersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAnswer', () => {
    it('should call service.submitAnswer with the provided DTO', async () => {
      // Act
      await controller.submitAnswer(mockSubmitAnswerDto);

      // Assert
      expect(service.submitAnswer).toHaveBeenCalledWith(mockSubmitAnswerDto);
      expect(service.submitAnswer).toHaveBeenCalledTimes(1);
    });

    it('should return void when successful', async () => {
      // Act
      const result = await controller.submitAnswer(mockSubmitAnswerDto);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should propagate errors from the service', async () => {
      // Arrange
      const testError = new Error('Test error');
      service.submitAnswer.mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(
        controller.submitAnswer(mockSubmitAnswerDto),
      ).rejects.toThrow(testError);
    });

    // Testing the HttpCode decorator is more challenging in unit tests
    // This would typically be tested in an e2e test using SuperTest
    // Here's a placeholder for that type of test:
    it('should return HTTP 201 Created status code', () => {
      // In a real e2e test, we would use something like:
      // return request(app.getHttpServer())
      //   .post('/user-answers')
      //   .send(mockSubmitAnswerDto)
      //   .expect(HttpStatus.CREATED);

      // For now, we can verify that the decorator is applied

      const metadata = Reflect.getMetadata(
        '__httpCode__',
        controller.submitAnswer,
      ) as number;
      expect(metadata).toBe(HttpStatus.CREATED);
    });
  });
});
