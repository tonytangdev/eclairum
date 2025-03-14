import { faker } from "@faker-js/faker";
import { FetchQuestionsForUserUseCase } from "./fetch-questions-for-user.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { User } from "../entities/user";
import { Question } from "../entities/question";
import { UserAnswer } from "../entities/user_answer";
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

  const createMockUserAnswer = (questionId: string) =>
    ({
      getUserId: () => userId,
      getQuestionId: () => questionId,
    }) as UserAnswer;

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

  it("should return unanswered questions when available", async () => {
    const answeredQuestionIds = [
      mockQuestions[0].getId(),
      mockQuestions[1].getId(),
    ];

    const userAnswers = answeredQuestionIds.map(createMockUserAnswer);
    userAnswersRepository.findByUserId.mockResolvedValue(userAnswers);

    const result = await useCase.execute({ userId });
    expect(result.questions.length).toBe(3);

    const returnedIds = new Set(result.questions.map((q) => q.getId()));
    const answeredIdSet = new Set(answeredQuestionIds);
    const expectedUnansweredIds = mockQuestions
      .filter((q) => !answeredIdSet.has(q.getId()))
      .map((q) => q.getId());

    returnedIds.forEach((id) => {
      expect(expectedUnansweredIds).toContain(id);
    });

    answeredQuestionIds.forEach((id) => {
      expect(returnedIds.has(id)).toBe(false);
    });
  });

  it("should return random questions when user hasn't answered any", async () => {
    const result = await useCase.execute({ userId });
    expect(result.questions.length).toBe(3);
  });

  it("should return least frequently answered questions when user answered all", async () => {
    const userAnswers = [
      ...Array<string>(3).fill(mockQuestions[0].getId()), // 3 times
      ...Array<string>(2).fill(mockQuestions[1].getId()), // 2 times
      mockQuestions[2].getId(), // 1 time
      mockQuestions[3].getId(), // 1 time
      ...Array<string>(4).fill(mockQuestions[4].getId()), // 4 times
    ].map(createMockUserAnswer);

    userAnswersRepository.findByUserId.mockResolvedValue(userAnswers);

    const result = await useCase.execute({ userId });
    expect(result.questions.length).toBe(3);

    const resultIds = result.questions.map((q) => q.getId());

    expect(resultIds).toContain(mockQuestions[2].getId());
    expect(resultIds).toContain(mockQuestions[3].getId());
    expect(resultIds).toContain(mockQuestions[1].getId());

    expect(resultIds).not.toContain(mockQuestions[0].getId());
    expect(resultIds).not.toContain(mockQuestions[4].getId());
  });

  it("should respect the limit parameter", async () => {
    const result = await useCase.execute({ userId, limit: 2 });
    expect(result.questions.length).toBe(2);
  });

  it("should respect the limit parameter with unanswered questions", async () => {
    userAnswersRepository.findByUserId.mockResolvedValue([
      createMockUserAnswer(mockQuestions[0].getId()),
    ]);

    const result = await useCase.execute({ userId, limit: 2 });
    expect(result.questions.length).toBe(2);
    const returnedIds = result.questions.map((q) => q.getId());
    expect(returnedIds).not.toContain(mockQuestions[0].getId());
  });

  it("should handle limit greater than available questions", async () => {
    const answeredQuestionIds = [
      mockQuestions[0].getId(),
      mockQuestions[1].getId(),
      mockQuestions[2].getId(),
    ];
    userAnswersRepository.findByUserId.mockResolvedValue(
      answeredQuestionIds.map(createMockUserAnswer),
    );

    const result = await useCase.execute({ userId, limit: 10 });
    expect(result.questions.length).toBe(mockQuestions.length);

    const returnedIds = new Set(result.questions.map((q) => q.getId()));
    expect(returnedIds.has(mockQuestions[3].getId())).toBe(true);
    expect(returnedIds.has(mockQuestions[4].getId())).toBe(true);
  });

  it("should return all questions with equal minimum frequency when limit allows", async () => {
    const userAnswers = [
      ...Array<string>(2).fill(mockQuestions[0].getId()), // 2 times
      mockQuestions[1].getId(), // 1 time
      mockQuestions[2].getId(), // 1 time
      ...Array<string>(3).fill(mockQuestions[3].getId()), // 3 times
      mockQuestions[4].getId(), // 1 time
    ].map(createMockUserAnswer);

    userAnswersRepository.findByUserId.mockResolvedValue(userAnswers);

    const result = await useCase.execute({ userId, limit: 3 });
    expect(result.questions.length).toBe(3);

    const resultIds = new Set(result.questions.map((q) => q.getId()));
    expect(resultIds.has(mockQuestions[1].getId())).toBe(true);
    expect(resultIds.has(mockQuestions[2].getId())).toBe(true);
    expect(resultIds.has(mockQuestions[4].getId())).toBe(true);
    expect(resultIds.has(mockQuestions[0].getId())).toBe(false);
    expect(resultIds.has(mockQuestions[3].getId())).toBe(false);
  });

  it("should handle zero limit by returning empty array", async () => {
    const result = await useCase.execute({ userId, limit: 0 });
    expect(result.questions).toEqual([]);
  });

  it("should handle negative limit by returning empty array", async () => {
    const result = await useCase.execute({ userId, limit: -5 });
    expect(result.questions).toEqual([]);
  });

  it("should handle single question case correctly", async () => {
    const singleQuestion = [createMockQuestion(faker.string.uuid())];
    questionRepository.findAll.mockResolvedValue(singleQuestion);

    const result = await useCase.execute({ userId });
    expect(result.questions.length).toBe(1);
    expect(result.questions[0].getId()).toBe(singleQuestion[0].getId());
  });

  it("should fill up to limit with least answered questions when not enough unanswered questions", async () => {
    const userAnswers = [
      createMockUserAnswer(mockQuestions[0].getId()), // frequency: 1
      ...Array(3).fill(mockQuestions[1].getId()).map(createMockUserAnswer), // frequency: 3
      ...Array(2).fill(mockQuestions[2].getId()).map(createMockUserAnswer), // frequency: 2
    ];

    userAnswersRepository.findByUserId.mockResolvedValue(userAnswers);

    const result = await useCase.execute({ userId, limit: 3 });
    expect(result.questions.length).toBe(3);

    const resultIds = result.questions.map((q) => q.getId());

    expect(resultIds).toContain(mockQuestions[3].getId());
    expect(resultIds).toContain(mockQuestions[4].getId());
    expect(resultIds).toContain(mockQuestions[0].getId());

    expect(resultIds).not.toContain(mockQuestions[1].getId());
    expect(resultIds).not.toContain(mockQuestions[2].getId());
  });
});
