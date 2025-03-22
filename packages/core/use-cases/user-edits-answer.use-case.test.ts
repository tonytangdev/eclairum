import { faker } from "@faker-js/faker";
import { UserEditsAnswerUseCase } from "./user-edits-answer.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { User } from "../entities/user";
import { Answer } from "../entities/answer";
import { Question } from "../entities/question";
import {
  UserNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";
import { QuizGenerationTask } from "../entities";
import { InvalidAnswerError } from "../errors";

describe("UserEditsAnswerUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let answerRepository: jest.Mocked<AnswerRepository>;
  let quizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let useCase: UserEditsAnswerUseCase;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    answerRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepository>;

    quizGenerationTaskRepository = {
      findById: jest.fn(),
      findQuestionById: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    useCase = new UserEditsAnswerUseCase(
      userRepository,
      answerRepository,
      quizGenerationTaskRepository,
    );
  });

  it("should edit an answer successfully", async () => {
    const userId = faker.string.uuid();
    const answerId = faker.string.uuid();
    const answerContent = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    const user = { id: userId } as unknown as User;
    const answer = {
      getId: () => answerId,
      getQuestionId: () => faker.string.uuid(),
      setContent: jest.fn(),
      setIsCorrect: jest.fn(),
    } as unknown as Answer;
    const question = {
      getQuizGenerationTaskId: () => faker.string.uuid(),
    } as unknown as Question;
    const task = {
      getUserId: () => userId,
    } as unknown as QuizGenerationTask;

    userRepository.findById.mockResolvedValue(user);
    answerRepository.findById.mockResolvedValue(answer);
    quizGenerationTaskRepository.findQuestionById.mockResolvedValue(question);
    quizGenerationTaskRepository.findById.mockResolvedValue(task);

    const response = await useCase.execute({
      userId,
      answerId,
      answerContent,
      isCorrect,
    });

    expect(response.answer).toBe(answer);
    expect(answer.setContent).toHaveBeenCalledWith(answerContent);
    expect(answer.setIsCorrect).toHaveBeenCalledWith(isCorrect);
    expect(answerRepository.save).toHaveBeenCalledWith(answer);
  });

  it("should throw UserNotFoundError if user does not exist", async () => {
    const userId = faker.string.uuid();
    const answerId = faker.string.uuid();
    const answerContent = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId,
        answerId,
        answerContent,
        isCorrect,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it("should throw InvalidAnswerError if answer does not exist", async () => {
    const userId = faker.string.uuid();
    const answerId = faker.string.uuid();
    const answerContent = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    userRepository.findById.mockResolvedValue({
      id: userId,
    } as unknown as User);
    answerRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId,
        answerId,
        answerContent,
        isCorrect,
      }),
    ).rejects.toThrow(InvalidAnswerError);
  });

  it("should throw UnauthorizedTaskAccessError if user does not own the answer", async () => {
    const userId = faker.string.uuid();
    const answerId = faker.string.uuid();
    const answerContent = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    const user = { id: userId } as unknown as User;
    const answer = {
      getId: () => answerId,
      getQuestionId: () => faker.string.uuid(),
    } as unknown as Answer;
    const question = {
      getQuizGenerationTaskId: () => faker.string.uuid(),
    } as unknown as Question;
    const task = {
      getUserId: () => faker.string.uuid(),
    } as unknown as QuizGenerationTask;

    userRepository.findById.mockResolvedValue(user);
    answerRepository.findById.mockResolvedValue(answer);
    quizGenerationTaskRepository.findQuestionById.mockResolvedValue(question);
    quizGenerationTaskRepository.findById.mockResolvedValue(task);

    await expect(
      useCase.execute({
        userId,
        answerId,
        answerContent,
        isCorrect,
      }),
    ).rejects.toThrow(UnauthorizedTaskAccessError);
  });

  it("should throw InvalidAnswerError if answer content is empty", async () => {
    const userId = faker.string.uuid();
    const answerId = faker.string.uuid();
    const answerContent = "";
    const isCorrect = faker.datatype.boolean();

    const user = { id: userId } as unknown as User;
    const answer = {
      getId: () => answerId,
      getQuestionId: () => faker.string.uuid(),
    } as unknown as Answer;
    const question = {
      getQuizGenerationTaskId: () => faker.string.uuid(),
    } as unknown as Question;
    const task = {
      getUserId: () => userId,
    } as unknown as QuizGenerationTask;

    userRepository.findById.mockResolvedValue(user);
    answerRepository.findById.mockResolvedValue(answer);
    quizGenerationTaskRepository.findQuestionById.mockResolvedValue(question);
    quizGenerationTaskRepository.findById.mockResolvedValue(task);

    await expect(
      useCase.execute({
        userId,
        answerId,
        answerContent,
        isCorrect,
      }),
    ).rejects.toThrow(InvalidAnswerError);
  });
});
