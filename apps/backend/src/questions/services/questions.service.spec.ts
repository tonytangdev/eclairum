import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { QuestionsService } from './questions.service';
import { QuestionRepositoryImpl } from '../infrastructure/relational/repositories/question.repository';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { UserAnswerRepositoryImpl } from '../../user-answers/infrastructure/relational/repositories/user-answer.repository';
import { FetchQuestionsForUserUseCase } from '@eclairum/core/use-cases';

// Mock the core use case
jest.mock('@eclairum/core/use-cases', () => {
  return {
    FetchQuestionsForUserUseCase: jest.fn().mockImplementation(() => {
      return {
        execute: jest.fn(),
      };
    }),
  };
});

describe('QuestionsService', () => {
  let service: QuestionsService;
  let mockQuestionRepository: Partial<QuestionRepositoryImpl>;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockUserAnswerRepository: Partial<UserAnswerRepositoryImpl>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockQuestionRepository = {};
    mockUserRepository = {};
    mockUserAnswerRepository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: QuestionRepositoryImpl,
          useValue: mockQuestionRepository,
        },
        {
          provide: UserRepositoryImpl,
          useValue: mockUserRepository,
        },
        {
          provide: UserAnswerRepositoryImpl,
          useValue: mockUserAnswerRepository,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuestions', () => {
    it('should return questions successfully with default limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockQuestions = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        content: faker.lorem.sentence(),
      }));

      // Setup mock use case execute method
      const executeMethod = jest.fn().mockResolvedValueOnce({
        questions: mockQuestions,
      });

      // Mock the use case constructor
      (FetchQuestionsForUserUseCase as jest.Mock).mockImplementationOnce(
        () => ({
          execute: executeMethod,
        }),
      );

      // Act
      const result = await service.getQuestions(userId);

      // Assert
      expect(result).toEqual({
        data: mockQuestions,
        metadata: {
          count: 3,
        },
        success: true,
      });
      expect(executeMethod).toHaveBeenCalledWith({ userId, limit: 3 });
      expect(FetchQuestionsForUserUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockQuestionRepository,
        mockUserAnswerRepository,
      );
    });

    it('should return questions successfully with custom limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const limit = 5;
      const mockQuestions = Array.from({ length: limit }, () => ({
        id: faker.string.uuid(),
        content: faker.lorem.sentence(),
      }));

      // Setup mock use case execute method
      const executeMethod = jest.fn().mockResolvedValueOnce({
        questions: mockQuestions,
      });

      // Mock the use case constructor
      (FetchQuestionsForUserUseCase as jest.Mock).mockImplementationOnce(
        () => ({
          execute: executeMethod,
        }),
      );

      // Act
      const result = await service.getQuestions(userId, limit);

      // Assert
      expect(result).toEqual({
        data: mockQuestions,
        metadata: {
          count: limit,
        },
        success: true,
      });
      expect(executeMethod).toHaveBeenCalledWith({ userId, limit });
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const errorMessage = 'User not found';

      // Setup mock use case execute method to throw an error
      const executeMethod = jest
        .fn()
        .mockRejectedValueOnce(new Error(errorMessage));

      // Mock the use case constructor
      (FetchQuestionsForUserUseCase as jest.Mock).mockImplementationOnce(
        () => ({
          execute: executeMethod,
        }),
      );

      // Act
      const result = await service.getQuestions(userId);

      // Assert
      expect(result).toEqual({
        data: [],
        metadata: {
          count: 0,
          error: errorMessage,
        },
        success: false,
      });
      expect(executeMethod).toHaveBeenCalledWith({ userId, limit: 3 });
    });

    it('should return empty array when use case returns empty questions', async () => {
      // Arrange
      const userId = faker.string.uuid();

      // Setup mock use case execute method
      const executeMethod = jest.fn().mockResolvedValueOnce({
        questions: [],
      });

      // Mock the use case constructor
      (FetchQuestionsForUserUseCase as jest.Mock).mockImplementationOnce(
        () => ({
          execute: executeMethod,
        }),
      );

      // Act
      const result = await service.getQuestions(userId);

      // Assert
      expect(result).toEqual({
        data: [],
        metadata: {
          count: 0,
        },
        success: true,
      });
    });
  });
});
