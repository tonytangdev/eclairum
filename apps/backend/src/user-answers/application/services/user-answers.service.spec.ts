import { Test, TestingModule } from '@nestjs/testing';
import { UserAnswersService } from './user-answers.service';
import { UserRepositoryImpl } from '../../../users/infrastructure/relational/user.repository';
import { UserAnswerRepositoryImpl } from '../../infrastructure/relational/repositories/user-answer.repository';
import { AnswerRepositoryImpl } from '../../../answers/infrastructure/relational/repositories/answer.repository';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { faker } from '@faker-js/faker';

// Import the actual class but mock it separately
import { UserAnswersQuestionUseCase } from '@flash-me/core/use-cases';

// Create a mock constructor
const MockUserAnswersQuestionUseCase = jest.fn();
// Add a mock execute method to the prototype
MockUserAnswersQuestionUseCase.prototype.execute = jest
  .fn()
  .mockResolvedValue(undefined);

// Replace the actual implementation with our mock
jest.mock('@flash-me/core/use-cases', () => ({
  UserAnswersQuestionUseCase: MockUserAnswersQuestionUseCase,
}));

describe('UserAnswersService', () => {
  let service: UserAnswersService;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockUserAnswerRepository: Partial<UserAnswerRepositoryImpl>;
  let mockAnswerRepository: Partial<AnswerRepositoryImpl>;

  const mockSubmitAnswerDto: SubmitAnswerDto = {
    userId: faker.string.alphanumeric(10),
    questionId: faker.string.uuid(),
    answerId: faker.string.uuid(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repositories with proper types
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    mockUserAnswerRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockAnswerRepository = {
      findById: jest.fn(),
      findByQuestionId: jest.fn(),
      saveAnswers: jest.fn(),
    };

    // Create the test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAnswersService,
        {
          provide: UserRepositoryImpl,
          useValue: mockUserRepository,
        },
        {
          provide: UserAnswerRepositoryImpl,
          useValue: mockUserAnswerRepository,
        },
        {
          provide: AnswerRepositoryImpl,
          useValue: mockAnswerRepository,
        },
      ],
    }).compile();

    service = module.get<UserAnswersService>(UserAnswersService);
  });

  describe('submitAnswer', () => {
    it('should instantiate the use case with the correct repositories', async () => {
      // Act
      await service.submitAnswer(mockSubmitAnswerDto);

      // Assert
      expect(MockUserAnswersQuestionUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockUserAnswerRepository,
        mockAnswerRepository,
      );
      expect(MockUserAnswersQuestionUseCase).toHaveBeenCalledTimes(1);
    });

    it('should call useCase.execute with the correct parameters', async () => {
      // Act
      await service.submitAnswer(mockSubmitAnswerDto);

      // Assert
      expect(
        MockUserAnswersQuestionUseCase.prototype.execute,
      ).toHaveBeenCalledWith({
        userId: mockSubmitAnswerDto.userId,
        questionId: mockSubmitAnswerDto.questionId,
        answerId: mockSubmitAnswerDto.answerId,
      });
      expect(
        MockUserAnswersQuestionUseCase.prototype.execute,
      ).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const testError = new Error('Test error from use case');
      MockUserAnswersQuestionUseCase.prototype.execute.mockRejectedValueOnce(
        testError,
      );

      // Act & Assert
      await expect(service.submitAnswer(mockSubmitAnswerDto)).rejects.toThrow(
        testError,
      );
      expect(
        MockUserAnswersQuestionUseCase.prototype.execute,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
