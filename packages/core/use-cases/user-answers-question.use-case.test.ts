import { faker } from "@faker-js/faker";
import { UserAnswersQuestionUseCase } from "./user-answers-question.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { Answer } from "../entities/answer";
import { UserAnswer } from "../entities/user-answer";
import { User } from "../entities/user";
import { UserNotFoundError } from "../errors/quiz-errors";
import {
  InvalidAnswerError,
  UserAnswerStorageError,
} from "../errors/user-answer-errors";

describe("UserAnswersQuestionUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let userAnswersRepository: jest.Mocked<UserAnswersRepository>;
  let answerRepository: jest.Mocked<AnswerRepository>;
  let useCase: UserAnswersQuestionUseCase;

  const userId = faker.string.uuid();
  const questionId = faker.string.uuid();
  const answerId = faker.string.uuid();

  const mockUser = {
    getId: () => userId,
    getEmail: () => "user@example.com",
  } as User;

  const mockAnswer = {
    getId: () => answerId,
    getQuestionId: () => questionId,
    getIsCorrect: () => true,
    getContent: () => "Answer content",
  } as Answer;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    userAnswersRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findAnsweredQuestionIds: jest.fn(),
      findQuestionAnswerFrequencies: jest.fn(),
    };

    answerRepository = {
      findById: jest.fn(),
      saveAnswers: jest.fn(),
      findByQuestionId: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepository>;

    useCase = new UserAnswersQuestionUseCase(
      userRepository,
      userAnswersRepository,
      answerRepository,
    );
  });

  it("should successfully process a user answering a question", async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    answerRepository.findById.mockResolvedValue(mockAnswer);
    userAnswersRepository.save.mockResolvedValue({} as UserAnswer);

    await expect(
      useCase.execute({
        userId,
        questionId,
        answerId,
      }),
    ).resolves.not.toThrow();

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(answerRepository.findById).toHaveBeenCalledWith(answerId);
    expect(userAnswersRepository.save).toHaveBeenCalled();

    // Verify UserAnswer was created with correct parameters
    const savedUserAnswer = userAnswersRepository.save.mock.calls[0][0];
    expect(savedUserAnswer.getUserId()).toBe(userId);
    expect(savedUserAnswer.getQuestionId()).toBe(questionId);
    expect(savedUserAnswer.getAnswerId()).toBe(answerId);
  });

  it("should throw UserNotFoundError when user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId,
        questionId,
        answerId,
      }),
    ).rejects.toThrow(UserNotFoundError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(answerRepository.findById).not.toHaveBeenCalled();
    expect(userAnswersRepository.save).not.toHaveBeenCalled();
  });

  it("should throw InvalidAnswerError when answer is not found", async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    answerRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId,
        questionId,
        answerId,
      }),
    ).rejects.toThrow(InvalidAnswerError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(answerRepository.findById).toHaveBeenCalledWith(answerId);
    expect(userAnswersRepository.save).not.toHaveBeenCalled();
  });

  it("should throw InvalidAnswerError when answer does not belong to question", async () => {
    userRepository.findById.mockResolvedValue(mockUser);

    const wrongAnswer = {
      ...mockAnswer,
      getQuestionId: () => "wrong-question-id",
    };
    answerRepository.findById.mockResolvedValue(wrongAnswer as Answer);

    await expect(
      useCase.execute({
        userId,
        questionId,
        answerId,
      }),
    ).rejects.toThrow(InvalidAnswerError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(answerRepository.findById).toHaveBeenCalledWith(answerId);
    expect(userAnswersRepository.save).not.toHaveBeenCalled();
  });

  it("should throw UserAnswerStorageError when saving fails", async () => {
    userRepository.findById.mockResolvedValue(mockUser);
    answerRepository.findById.mockResolvedValue(mockAnswer);
    userAnswersRepository.save.mockRejectedValue(new Error("Database error"));

    await expect(
      useCase.execute({
        userId,
        questionId,
        answerId,
      }),
    ).rejects.toThrow(UserAnswerStorageError);

    expect(userRepository.findById).toHaveBeenCalledWith(userId);
    expect(answerRepository.findById).toHaveBeenCalledWith(answerId);
    expect(userAnswersRepository.save).toHaveBeenCalled();
  });
});
