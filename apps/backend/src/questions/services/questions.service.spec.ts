import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { QuestionsService } from './questions.service';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { UserAnswerRepositoryImpl } from '../../repositories/user-answers/user-answer.repository';
import {
  FetchQuestionsForUserUseCase,
  UserAddsQuestionUseCase,
  UserEditsQuestionUseCase, // Import the new use case
} from '@eclairum/core/use-cases';
import { AnswerRepositoryImpl } from '../../repositories/answers/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';

// Mock the core use case
jest.mock('@eclairum/core/use-cases', () => {
  return {
    FetchQuestionsForUserUseCase: jest.fn().mockImplementation(() => {
      return {
        execute: jest.fn(),
      };
    }),
    UserAddsQuestionUseCase: jest.fn().mockImplementation(() => {
      return {
        execute: jest.fn(),
      };
    }),
    UserEditsQuestionUseCase: jest.fn().mockImplementation(() => {
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
  let mockAnswerRepository: Partial<AnswerRepositoryImpl>;
  let mockQuizGenerationTaskRepository: Partial<QuizGenerationTaskRepositoryImpl>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockQuestionRepository = {};
    mockUserRepository = {};
    mockUserAnswerRepository = {};
    mockAnswerRepository = {};
    mockQuizGenerationTaskRepository = {};

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
        {
          provide: AnswerRepositoryImpl,
          useValue: mockAnswerRepository,
        },
        {
          provide: QuizGenerationTaskRepositoryImpl,
          useValue: mockQuizGenerationTaskRepository,
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

  describe('addQuestion', () => {
    it('should add a question successfully', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const questionContent = faker.lorem.sentence();
      const answers = [
        { content: faker.lorem.sentence(), isCorrect: true },
        { content: faker.lorem.sentence(), isCorrect: false },
      ];
      const mockQuestion = {
        getId: jest.fn().mockReturnValue(faker.string.uuid()),
      };

      // Setup mock use case execute method
      const executeMethod = jest.fn().mockResolvedValueOnce({
        question: mockQuestion,
      });

      // Mock the use case constructor
      (UserAddsQuestionUseCase as jest.Mock).mockImplementationOnce(() => ({
        execute: executeMethod,
      }));

      // Act
      const result = await service.addQuestion(
        userId,
        taskId,
        questionContent,
        answers,
      );

      // Assert
      expect(result).toEqual({
        data: mockQuestion,
        metadata: {
          questionId: mockQuestion.getId() as string,
        },
        success: true,
      });
      expect(executeMethod).toHaveBeenCalledWith({
        userId,
        taskId,
        questionContent,
        answers,
      });
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const taskId = faker.string.uuid();
      const questionContent = faker.lorem.sentence();
      const answers = [
        { content: faker.lorem.sentence(), isCorrect: true },
        { content: faker.lorem.sentence(), isCorrect: false },
      ];
      const errorMessage = 'Failed to add question';

      // Setup mock use case execute method to throw an error
      const executeMethod = jest
        .fn()
        .mockRejectedValueOnce(new Error(errorMessage));

      // Mock the use case constructor
      (UserAddsQuestionUseCase as jest.Mock).mockImplementationOnce(() => ({
        execute: executeMethod,
      }));

      // Act
      const result = await service.addQuestion(
        userId,
        taskId,
        questionContent,
        answers,
      );

      // Assert
      expect(result).toEqual({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });
      expect(executeMethod).toHaveBeenCalledWith({
        userId,
        taskId,
        questionContent,
        answers,
      });
    });
  });

  describe('editQuestion', () => {
    it('should edit a question successfully', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const questionId = faker.string.uuid();
      const questionContent = faker.lorem.sentence();
      const mockQuestion = {
        getId: jest.fn().mockReturnValue(questionId),
      };

      // Setup mock use case execute method
      const executeMethod = jest.fn().mockResolvedValueOnce({
        question: mockQuestion,
      });

      // Mock the use case constructor
      (UserEditsQuestionUseCase as jest.Mock).mockImplementationOnce(() => ({
        execute: executeMethod,
      }));

      // Act
      const result = await service.editQuestion(
        userId,
        questionId,
        questionContent,
      );

      // Assert
      expect(result).toEqual({
        data: mockQuestion,
        metadata: {
          questionId: questionId,
        },
        success: true,
      });
      expect(executeMethod).toHaveBeenCalledWith({
        userId,
        questionId,
        questionContent,
      });
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const questionId = faker.string.uuid();
      const questionContent = faker.lorem.sentence();
      const errorMessage = 'Failed to edit question';

      // Setup mock use case execute method to throw an error
      const executeMethod = jest
        .fn()
        .mockRejectedValueOnce(new Error(errorMessage));

      // Mock the use case constructor
      (UserEditsQuestionUseCase as jest.Mock).mockImplementationOnce(() => ({
        execute: executeMethod,
      }));

      // Act
      const result = await service.editQuestion(
        userId,
        questionId,
        questionContent,
      );

      // Assert
      expect(result).toEqual({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });
      expect(executeMethod).toHaveBeenCalledWith({
        userId,
        questionId,
        questionContent,
      });
    });
  });
});
