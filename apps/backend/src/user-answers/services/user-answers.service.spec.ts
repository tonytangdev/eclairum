// Fix for hoisting issue - mock the module before imports
jest.mock('@flash-me/core/use-cases', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual('@flash-me/core/use-cases');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    UserAnswersQuestionUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn(),
    })),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserAnswersService } from './user-answers.service';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { UserAnswerRepositoryImpl } from '../infrastructure/relational/repositories/user-answer.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { faker } from '@faker-js/faker';
import { UserAnswersQuestionUseCase } from '@flash-me/core/use-cases';

describe('UserAnswersService', () => {
  let service: UserAnswersService;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockUserAnswerRepository: Partial<UserAnswerRepositoryImpl>;
  let mockAnswerRepository: Partial<AnswerRepositoryImpl>;
  let mockUseCaseInstance: { execute: jest.Mock };

  const createMockSubmitAnswerDto = (overrides = {}): SubmitAnswerDto => ({
    userId: faker.string.alphanumeric(10),
    questionId: faker.string.uuid(),
    answerId: faker.string.uuid(),
    ...overrides,
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock execute function that we can control in tests
    mockUseCaseInstance = {
      execute: jest.fn(),
    };

    // Setup the mock implementation to return our controllable instance
    (UserAnswersQuestionUseCase as jest.Mock).mockImplementation(
      () => mockUseCaseInstance,
    );

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
    describe('use case instantiation', () => {
      it('should instantiate the use case with the correct repositories', async () => {
        // Arrange
        const mockSubmitAnswerDto = createMockSubmitAnswerDto();

        // Act
        await service.submitAnswer(mockSubmitAnswerDto);

        // Assert
        expect(UserAnswersQuestionUseCase).toHaveBeenCalledWith(
          mockUserRepository,
          mockUserAnswerRepository,
          mockAnswerRepository,
        );
        expect(UserAnswersQuestionUseCase).toHaveBeenCalledTimes(1);
      });
    });

    describe('use case execution', () => {
      it('should call useCase.execute with the correct parameters', async () => {
        // Arrange
        const mockSubmitAnswerDto = createMockSubmitAnswerDto();

        // Act
        await service.submitAnswer(mockSubmitAnswerDto);

        // Assert
        expect(mockUseCaseInstance.execute).toHaveBeenCalledWith({
          userId: mockSubmitAnswerDto.userId,
          questionId: mockSubmitAnswerDto.questionId,
          answerId: mockSubmitAnswerDto.answerId,
        });
        expect(mockUseCaseInstance.execute).toHaveBeenCalledTimes(1);
      });

      it('should successfully complete when the use case returns void', async () => {
        // Arrange
        const mockSubmitAnswerDto = createMockSubmitAnswerDto();
        mockUseCaseInstance.execute.mockResolvedValue(undefined);

        // Act & Assert
        await expect(
          service.submitAnswer(mockSubmitAnswerDto),
        ).resolves.toBeUndefined();
      });

      it('should handle different input parameters correctly', async () => {
        // Arrange
        const customDto = createMockSubmitAnswerDto({
          userId: 'custom-user-id',
          questionId: 'custom-question-id',
          answerId: 'custom-answer-id',
        });

        // Act
        await service.submitAnswer(customDto);

        // Assert
        expect(mockUseCaseInstance.execute).toHaveBeenCalledWith({
          userId: 'custom-user-id',
          questionId: 'custom-question-id',
          answerId: 'custom-answer-id',
        });
      });
    });

    describe('error handling', () => {
      it('should propagate generic errors from the use case', async () => {
        // Arrange
        const mockSubmitAnswerDto = createMockSubmitAnswerDto();
        const testError = new Error('Test error from use case');
        mockUseCaseInstance.execute.mockRejectedValueOnce(testError);

        // Act & Assert
        await expect(service.submitAnswer(mockSubmitAnswerDto)).rejects.toThrow(
          testError,
        );
        expect(mockUseCaseInstance.execute).toHaveBeenCalledTimes(1);
      });

      it('should propagate specific domain errors with correct error type', async () => {
        // Arrange
        const mockSubmitAnswerDto = createMockSubmitAnswerDto();
        class DomainSpecificError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'DomainSpecificError';
          }
        }
        const domainError = new DomainSpecificError('Domain specific error');
        mockUseCaseInstance.execute.mockRejectedValueOnce(domainError);

        // Act & Assert
        await expect(service.submitAnswer(mockSubmitAnswerDto)).rejects.toThrow(
          domainError,
        );
        expect(mockUseCaseInstance.execute).toHaveBeenCalledTimes(1);
      });
    });
  });
});
