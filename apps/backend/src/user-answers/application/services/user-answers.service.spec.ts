import { Test, TestingModule } from '@nestjs/testing';
import { UserAnswersService } from './user-answers.service';
import { UserAnswersQuestionUseCase } from '@flash-me/core/use-cases';
import { UserRepositoryImpl } from '../../../users/infrastructure/relational/user.repository';
import { UserAnswerRepositoryImpl } from '../../infrastructure/relational/repositories/user-answer.repository';
import { AnswerRepositoryImpl } from '../../../answers/infrastructure/relational/repositories/answer.repository';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { faker } from '@faker-js/faker';

// Mock the use case
jest.mock('@flash-me/core/use-cases', () => ({
  UserAnswersQuestionUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('UserAnswersService', () => {
  let service: UserAnswersService;
  let mockUserRepository: jest.Mocked<UserRepositoryImpl>;
  let mockUserAnswerRepository: jest.Mocked<UserAnswerRepositoryImpl>;
  let mockAnswerRepository: jest.Mocked<AnswerRepositoryImpl>;
  let mockUseCase: jest.MockedClass<typeof UserAnswersQuestionUseCase>;

  const mockSubmitAnswerDto: SubmitAnswerDto = {
    userId: faker.string.alphanumeric(10),
    questionId: faker.string.uuid(),
    answerId: faker.string.uuid(),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepositoryImpl>;

    mockUserAnswerRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserAnswerRepositoryImpl>;

    mockAnswerRepository = {
      findById: jest.fn(),
      findByQuestionId: jest.fn(),
      saveAnswers: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepositoryImpl>;

    // Get the mocked use case constructor
    mockUseCase = UserAnswersQuestionUseCase as jest.MockedClass<
      typeof UserAnswersQuestionUseCase
    >;

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
      expect(mockUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockUserAnswerRepository,
        mockAnswerRepository,
      );
      expect(mockUseCase).toHaveBeenCalledTimes(1);
    });

    it('should call useCase.execute with the correct parameters', async () => {
      // Act
      await service.submitAnswer(mockSubmitAnswerDto);

      // Assert
      const useCaseInstance = mockUseCase.mock.instances[0];
      expect(useCaseInstance.execute).toHaveBeenCalledWith({
        userId: mockSubmitAnswerDto.userId,
        questionId: mockSubmitAnswerDto.questionId,
        answerId: mockSubmitAnswerDto.answerId,
      });
      expect(useCaseInstance.execute).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const testError = new Error('Test error from use case');
      const mockExecute = jest.fn().mockRejectedValue(testError);
      mockUseCase.mockImplementationOnce(
        () =>
          ({
            execute: mockExecute,
            userRepository: mockUserRepository,
            userAnswersRepository: mockUserAnswerRepository,
            answerRepository: mockAnswerRepository,
            fetchAnswer: jest.fn(),
            fetchUser: jest.fn(),
            createUserAnswer: jest.fn(),
          }) as unknown as UserAnswersQuestionUseCase,
      );

      // Act & Assert
      await expect(service.submitAnswer(mockSubmitAnswerDto)).rejects.toThrow(
        testError,
      );
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });
});
