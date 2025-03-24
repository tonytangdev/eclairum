import { faker } from "@faker-js/faker";
import { FetchQuestionsForUserUseCase } from "./fetch-questions-for-user.use-case";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { Question } from "../entities/question";
import { User } from "../entities/user";
import { UserNotFoundError } from "../errors/quiz-errors";
import { QuestionSelector } from "../services/question-selector.service";

// Mock the QuestionSelector to control its behavior
jest.mock("../services/question-selector.service");

describe("FetchQuestionsForUserUseCase", () => {
  let useCase: FetchQuestionsForUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockQuestionRepository: jest.Mocked<QuestionRepository>;
  let mockUserAnswersRepository: jest.Mocked<UserAnswersRepository>;
  let mockQuestionSelector: jest.Mocked<QuestionSelector>;

  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();
  const mockUser = { id: userId } as unknown as User;

  const mockQuestions = [
    { getId: () => faker.string.uuid() } as Question,
    { getId: () => faker.string.uuid() } as Question,
    { getId: () => faker.string.uuid() } as Question,
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup repository mocks
    mockUserRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockQuestionRepository = {
      findByUserId: jest.fn(),
      findByQuizGenerationTaskId: jest.fn(), // Add the new method
    } as unknown as jest.Mocked<QuestionRepository>;

    mockUserAnswersRepository = {
      findQuestionAnswerFrequencies: jest.fn(),
    } as unknown as jest.Mocked<UserAnswersRepository>;

    // Setup the mocked QuestionSelector
    mockQuestionSelector = {
      selectQuestionsWithFrequencies: jest.fn(),
    } as unknown as jest.Mocked<QuestionSelector>;

    // Set the mock implementation to return the mock instance
    (QuestionSelector as jest.Mock).mockImplementation(
      () => mockQuestionSelector,
    );

    // Create the use case with mocked repositories
    useCase = new FetchQuestionsForUserUseCase(
      mockUserRepository,
      mockQuestionRepository,
      mockUserAnswersRepository,
    );
  });

  it("should throw error if user does not exist", async () => {
    // Setup
    mockUserRepository.findById.mockResolvedValue(null);

    // Test
    await expect(useCase.execute({ userId })).rejects.toThrow(
      UserNotFoundError,
    );
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
  });

  it("should return empty array if limit is zero or negative", async () => {
    // Setup
    mockUserRepository.findById.mockResolvedValue(mockUser);

    // Test with limit = 0
    const result = await useCase.execute({ userId, limit: 0 });

    // Assert
    expect(result).toEqual({ questions: [] });
    expect(mockQuestionRepository.findByUserId).not.toHaveBeenCalled();
    expect(
      mockUserAnswersRepository.findQuestionAnswerFrequencies,
    ).not.toHaveBeenCalled();
  });

  it("should return empty array if no questions exist", async () => {
    // Setup
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuestionRepository.findByUserId.mockResolvedValue([]);

    // Test
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({ questions: [] });
    expect(mockQuestionRepository.findByUserId).toHaveBeenCalled();
    expect(
      mockUserAnswersRepository.findQuestionAnswerFrequencies,
    ).not.toHaveBeenCalled();
  });

  it("should call repositories and return questions", async () => {
    // Setup
    const questionFrequencies = new Map<string, number>([
      [mockQuestions[0].getId(), 1],
      [mockQuestions[1].getId(), 0],
    ]);

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuestionRepository.findByUserId.mockResolvedValue(mockQuestions);
    mockUserAnswersRepository.findQuestionAnswerFrequencies.mockResolvedValue(
      questionFrequencies,
    );
    mockQuestionSelector.selectQuestionsWithFrequencies.mockReturnValue(
      mockQuestions,
    );

    // Test
    const result = await useCase.execute({ userId, limit: 3 });

    // Assert
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockQuestionRepository.findByUserId).toHaveBeenCalled();
    expect(
      mockUserAnswersRepository.findQuestionAnswerFrequencies,
    ).toHaveBeenCalledWith(userId);
    expect(
      mockQuestionSelector.selectQuestionsWithFrequencies,
    ).toHaveBeenCalledWith(mockQuestions, questionFrequencies, 3);
    expect(result).toEqual({ questions: mockQuestions });
  });

  it("should use default limit of 3 when not specified", async () => {
    // Setup
    const questionFrequencies = new Map<string, number>();

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuestionRepository.findByUserId.mockResolvedValue(mockQuestions);
    mockUserAnswersRepository.findQuestionAnswerFrequencies.mockResolvedValue(
      questionFrequencies,
    );
    mockQuestionSelector.selectQuestionsWithFrequencies.mockReturnValue(
      mockQuestions,
    );

    // Test (without specifying limit)
    await useCase.execute({ userId });

    // Assert default limit is used
    expect(
      mockQuestionSelector.selectQuestionsWithFrequencies,
    ).toHaveBeenCalledWith(
      mockQuestions,
      questionFrequencies,
      3, // Default limit
    );
  });

  it("should fetch questions by task ID when quizGenerationTaskId is provided", async () => {
    // Setup
    const questionFrequencies = new Map<string, number>();

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuestionRepository.findByQuizGenerationTaskId.mockResolvedValue(
      mockQuestions,
    );
    mockUserAnswersRepository.findQuestionAnswerFrequencies.mockResolvedValue(
      questionFrequencies,
    );
    mockQuestionSelector.selectQuestionsWithFrequencies.mockReturnValue(
      mockQuestions,
    );

    // Test with quizGenerationTaskId
    const result = await useCase.execute({
      userId,
      limit: 3,
      quizGenerationTaskId: taskId,
    });

    // Assert
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuestionRepository.findByQuizGenerationTaskId,
    ).toHaveBeenCalledWith(taskId);
    expect(mockQuestionRepository.findByUserId).not.toHaveBeenCalled();
    expect(
      mockUserAnswersRepository.findQuestionAnswerFrequencies,
    ).toHaveBeenCalledWith(userId);
    expect(
      mockQuestionSelector.selectQuestionsWithFrequencies,
    ).toHaveBeenCalledWith(mockQuestions, questionFrequencies, 3);
    expect(result).toEqual({ questions: mockQuestions });
  });

  it("should fetch questions by user ID when quizGenerationTaskId is not provided", async () => {
    // Setup
    const questionFrequencies = new Map<string, number>();

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuestionRepository.findByUserId.mockResolvedValue(mockQuestions);
    mockUserAnswersRepository.findQuestionAnswerFrequencies.mockResolvedValue(
      questionFrequencies,
    );
    mockQuestionSelector.selectQuestionsWithFrequencies.mockReturnValue(
      mockQuestions,
    );

    // Test without quizGenerationTaskId
    const result = await useCase.execute({ userId, limit: 3 });

    // Assert
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockQuestionRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(
      mockQuestionRepository.findByQuizGenerationTaskId,
    ).not.toHaveBeenCalled();
    expect(
      mockUserAnswersRepository.findQuestionAnswerFrequencies,
    ).toHaveBeenCalledWith(userId);
    expect(result).toEqual({ questions: mockQuestions });
  });

  it("should return empty array if no questions exist for the task", async () => {
    // Setup
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuestionRepository.findByQuizGenerationTaskId.mockResolvedValue([]);

    // Test
    const result = await useCase.execute({
      userId,
      quizGenerationTaskId: taskId,
    });

    // Assert
    expect(result).toEqual({ questions: [] });
    expect(
      mockQuestionRepository.findByQuizGenerationTaskId,
    ).toHaveBeenCalledWith(taskId);
    expect(
      mockUserAnswersRepository.findQuestionAnswerFrequencies,
    ).not.toHaveBeenCalled();
  });
});
