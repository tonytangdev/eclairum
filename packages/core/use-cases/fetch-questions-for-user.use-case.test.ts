import { faker } from "@faker-js/faker";
import { FetchQuestionsForUserUseCase } from "./fetch-questions-for-user.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { User } from "../entities/user";
import { Question } from "../entities/question";
import { UserNotFoundError } from "../errors/quiz-errors";

describe("FetchQuestionsForUserUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let questionRepository: jest.Mocked<QuestionRepository>;
  let userAnswersRepository: jest.Mocked<UserAnswersRepository>;
  let useCase: FetchQuestionsForUserUseCase;

  const userId = faker.string.uuid();
  const mockUser = {
    getId: () => userId,
    getEmail: () => "user@example.com",
  } as User;

  const createMockQuestion = (id: string) =>
    ({
      getId: () => id,
      getContent: () => `Question ${id}`,
    }) as Question;

  const mockQuestions = [
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    questionRepository = {
      saveQuestions: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    userAnswersRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByUserId: jest.fn(),
    };

    useCase = new FetchQuestionsForUserUseCase(
      userRepository,
      questionRepository,
      userAnswersRepository,
    );

    userRepository.findById.mockResolvedValue(mockUser);
    questionRepository.findAll.mockResolvedValue([...mockQuestions]);
    userAnswersRepository.findByUserId.mockResolvedValue([]);
  });

  it("should throw UserNotFoundError when user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId })).rejects.toThrow(
      UserNotFoundError,
    );

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(questionRepository.findAll).not.toHaveBeenCalled();
  });

  it("should return empty array when no questions exist", async () => {
    questionRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute({ userId });

    expect(result.questions).toEqual([]);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(questionRepository.findAll).toHaveBeenCalled();
  });

  it("should return empty array for zero or negative limit", async () => {
    const result = await useCase.execute({ userId, limit: 0 });
    expect(result.questions).toEqual([]);

    const result2 = await useCase.execute({ userId, limit: -5 });
    expect(result2.questions).toEqual([]);
  });

  it("should call repositories and return questions", async () => {
    const result = await useCase.execute({ userId });

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(questionRepository.findAll).toHaveBeenCalled();
    expect(userAnswersRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(result.questions.length).toBeGreaterThan(0);
  });
});
