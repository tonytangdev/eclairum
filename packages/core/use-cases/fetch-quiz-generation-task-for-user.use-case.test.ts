import { faker } from "@faker-js/faker";
import { FetchQuizGenerationTaskForUserUseCase } from "./fetch-quiz-generation-task-for-user.use-case";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { User } from "../entities/user";

describe("FetchQuizGenerationTaskForUserUseCase", () => {
  let useCase: FetchQuizGenerationTaskForUserUseCase;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let quizGenerationTaskRepositoryMock: jest.Mocked<QuizGenerationTaskRepository>;

  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();

  beforeEach(() => {
    userRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    quizGenerationTaskRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    useCase = new FetchQuizGenerationTaskForUserUseCase(
      userRepositoryMock,
      quizGenerationTaskRepositoryMock,
    );
  });

  describe("Given a user and task exist and the task belongs to the user", () => {
    const mockUser = { id: userId } as unknown as User;
    const mockTask = {
      id: taskId,
      getUserId: () => userId,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should return the task when the task belongs to the user", async () => {
      // Arrange - setup in beforeEach

      // Act
      const result = await useCase.execute({ userId, taskId });

      // Assert
      expect(result).toEqual({ task: mockTask });
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );
    });
  });

  describe("Given the user does not exist", () => {
    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw UserNotFoundError", async () => {
      // Arrange - setup in beforeEach

      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        UserNotFoundError,
      );

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).not.toHaveBeenCalled();
    });
  });

  describe("Given the task does not exist", () => {
    const mockUser = { id: userId } as unknown as User;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw TaskNotFoundError", async () => {
      // Arrange - setup in beforeEach

      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        TaskNotFoundError,
      );

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );
    });
  });

  describe("Given the task belongs to a different user", () => {
    const mockUser = { id: userId } as unknown as User;
    const differentUserId = faker.string.uuid();
    const mockTask = {
      id: taskId,
      getUserId: () => differentUserId, // Task belongs to a different user
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should throw UnauthorizedTaskAccessError", async () => {
      // Arrange - setup in beforeEach

      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        UnauthorizedTaskAccessError,
      );

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );
    });
  });
});
