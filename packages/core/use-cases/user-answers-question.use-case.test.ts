import { faker } from "@faker-js/faker";
import { UserAnswersQuestionUseCase } from "./user-answers-question.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { Answer } from "../entities/answer";
import { UserAnswer } from "../entities/user_answer";
import { User } from "../entities/user";
import { UserNotFoundError } from "../errors/quiz-errors";
import {
  InvalidAnswerError,
  UserAnswerStorageError,
} from "../errors/user-answer-errors";

describe("UserAnswersQuestionUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let userAnswersRepository: jest.Mocked<UserAnswersRepository>;
  let useCase: UserAnswersQuestionUseCase;

  const userId = faker.string.uuid();
  const questionId = faker.string.uuid();

  const mockUser = {
    getId: () => userId,
    getEmail: () => "user@example.com",
  } as User;

  const mockAnswer = {
    getId: () => faker.string.uuid(),
    getQuestionId: () => questionId,
    getIsCorrect: () => true,
    getContent: () => "Answer content",
  } as Answer;

  const mockUserAnswer = {
    getId: () => faker.string.uuid(),
    getUserId: () => userId,
    getQuestionId: () => questionId,
    getAnswer: () => mockAnswer,
    isCorrect: () => true,
  } as UserAnswer;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    userAnswersRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    useCase = new UserAnswersQuestionUseCase(
      userRepository,
      userAnswersRepository,
    );
  });

  it("should successfully process a user answering a question", async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    userAnswersRepository.save.mockResolvedValue(mockUserAnswer);

    const result = await useCase.execute({
      userId,
      questionId,
      answer: mockAnswer,
    });

    expect(result.userAnswer).toBe(mockUserAnswer);
    expect(result.isCorrect).toBe(true);
    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userAnswersRepository.save).toHaveBeenCalled();
  });

  it("should throw UserNotFoundError when user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId,
        questionId,
        answer: mockAnswer,
      }),
    ).rejects.toThrow(UserNotFoundError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userAnswersRepository.save).not.toHaveBeenCalled();
  });

  it("should throw InvalidAnswerError when answer does not belong to question", async () => {
    userRepository.findById.mockResolvedValue(mockUser);

    const wrongAnswer = {
      ...mockAnswer,
      getQuestionId: () => "wrong-question-id",
    };

    await expect(
      useCase.execute({
        userId,
        questionId,
        answer: wrongAnswer as Answer,
      }),
    ).rejects.toThrow(InvalidAnswerError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userAnswersRepository.save).not.toHaveBeenCalled();
  });

  it("should throw UserAnswerStorageError when saving fails", async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    userAnswersRepository.save.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({
        userId,
        questionId,
        answer: mockAnswer,
      }),
    ).rejects.toThrow(UserAnswerStorageError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(userAnswersRepository.save).toHaveBeenCalled();
  });
});
