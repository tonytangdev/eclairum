import { faker } from "@faker-js/faker";
import { SoftDeleteQuizGenerationTaskForUserUseCase } from "./soft-delete-quiz-generation-task-for-user.use-case";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { User } from "../entities/user";
import { Question } from "../entities/question";

describe("SoftDeleteQuizGenerationTaskForUserUseCase", () => {
  let useCase: SoftDeleteQuizGenerationTaskForUserUseCase;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let quizGenerationTaskRepositoryMock: jest.Mocked<QuizGenerationTaskRepository>;
  let questionRepositoryMock: jest.Mocked<QuestionRepository>;
  let answerRepositoryMock: jest.Mocked<AnswerRepository>;

  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();

  beforeEach(() => {
    // Setup repository mocks
    userRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    quizGenerationTaskRepositoryMock = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    questionRepositoryMock = {
      softDeleteByTaskId: jest.fn(),
    } as unknown as jest.Mocked<QuestionRepository>;

    answerRepositoryMock = {
      softDeleteByQuestionId: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepository>;

    // Create the use case with mocked repositories
    useCase = new SoftDeleteQuizGenerationTaskForUserUseCase(
      userRepositoryMock,
      quizGenerationTaskRepositoryMock,
      questionRepositoryMock,
      answerRepositoryMock,
    );
  });

  describe("Given a user and task exist and the task belongs to the user", () => {
    // Mock data with fixed IDs instead of randomly generated ones
    const mockUser = { getId: () => userId } as User;
    const question1Id = "question-id-1";
    const question2Id = "question-id-2";
    const mockQuestions = [
      { getId: () => question1Id } as Question,
      { getId: () => question2Id } as Question,
    ];
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
      getQuestions: () => mockQuestions,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      // Setup successful scenario mocks
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
      questionRepositoryMock.softDeleteByTaskId.mockResolvedValue();
      answerRepositoryMock.softDeleteByQuestionId.mockResolvedValue();
      quizGenerationTaskRepositoryMock.softDelete.mockResolvedValue();
    });

    it("should soft delete the task and all related entities", async () => {
      // Act
      const result = await useCase.execute({ userId, taskId });

      // Assert
      expect(result.success).toBe(true);

      // Verify user and task validation
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );

      // Verify answers were deleted for each question
      expect(answerRepositoryMock.softDeleteByQuestionId).toHaveBeenCalledTimes(
        mockQuestions.length,
      );

      // Check that the method was called with each specific question ID
      expect(answerRepositoryMock.softDeleteByQuestionId).toHaveBeenCalledWith(
        question1Id,
      );
      expect(answerRepositoryMock.softDeleteByQuestionId).toHaveBeenCalledWith(
        question2Id,
      );

      // Verify questions were deleted
      expect(questionRepositoryMock.softDeleteByTaskId).toHaveBeenCalledWith(
        taskId,
      );

      // Verify task was deleted
      expect(quizGenerationTaskRepositoryMock.softDelete).toHaveBeenCalledWith(
        taskId,
      );
    });

    it("should delete entities in the correct order (children before parent)", async () => {
      // Arrange
      const executionOrder: string[] = [];

      answerRepositoryMock.softDeleteByQuestionId.mockImplementation(
        async () => {
          executionOrder.push("delete answers");
          return Promise.resolve();
        },
      );

      questionRepositoryMock.softDeleteByTaskId.mockImplementation(async () => {
        executionOrder.push("delete questions");
        return Promise.resolve();
      });

      quizGenerationTaskRepositoryMock.softDelete.mockImplementation(
        async () => {
          executionOrder.push("delete task");
          return Promise.resolve();
        },
      );

      // Act
      await useCase.execute({ userId, taskId });

      // Assert - verify deletion order
      expect(executionOrder).toContain("delete answers");
      expect(executionOrder).toContain("delete questions");
      expect(executionOrder).toContain("delete task");

      // Check answers are deleted before questions and questions before task
      expect(executionOrder.indexOf("delete answers")).toBeLessThan(
        executionOrder.indexOf("delete task"),
      );
      expect(executionOrder.indexOf("delete questions")).toBeLessThan(
        executionOrder.indexOf("delete task"),
      );
    });
  });

  describe("Given the user does not exist", () => {
    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw UserNotFoundError", async () => {
      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        UserNotFoundError,
      );

      // Verify validation was called but deletion was not
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).not.toHaveBeenCalled();
      expect(questionRepositoryMock.softDeleteByTaskId).not.toHaveBeenCalled();
      expect(
        quizGenerationTaskRepositoryMock.softDelete,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Given the task does not exist", () => {
    beforeEach(() => {
      // User exists but task doesn't
      userRepositoryMock.findById.mockResolvedValue({} as User);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw TaskNotFoundError", async () => {
      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        TaskNotFoundError,
      );

      // Verify task validation was called but deletion was not
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );
      expect(questionRepositoryMock.softDeleteByTaskId).not.toHaveBeenCalled();
      expect(
        quizGenerationTaskRepositoryMock.softDelete,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Given the task belongs to a different user", () => {
    beforeEach(() => {
      // Task exists but belongs to different user
      const differentUserId = faker.string.uuid();
      userRepositoryMock.findById.mockResolvedValue({} as User);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue({
        getUserId: () => differentUserId,
      } as unknown as QuizGenerationTask);
    });

    it("should throw UnauthorizedTaskAccessError", async () => {
      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        UnauthorizedTaskAccessError,
      );

      // Verify ownership validation was called but deletion was not
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );
      expect(questionRepositoryMock.softDeleteByTaskId).not.toHaveBeenCalled();
      expect(
        quizGenerationTaskRepositoryMock.softDelete,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Given an error occurs during deletion", () => {
    // Mock data for successful validation
    const mockUser = { getId: () => userId } as User;
    const mockQuestions = [{ getId: () => faker.string.uuid() } as Question];
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
      getQuestions: () => mockQuestions,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      // Setup successful validation
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should propagate errors from answer deletion", async () => {
      // Arrange - simulate error during answer deletion
      const deleteError = new Error("Failed to delete answers");
      answerRepositoryMock.softDeleteByQuestionId.mockRejectedValue(
        deleteError,
      );

      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        deleteError,
      );

      // Verify task wasn't deleted after error
      expect(
        quizGenerationTaskRepositoryMock.softDelete,
      ).not.toHaveBeenCalled();
    });

    it("should propagate errors from question deletion", async () => {
      // Arrange - simulate error during question deletion
      const deleteError = new Error("Failed to delete questions");
      questionRepositoryMock.softDeleteByTaskId.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        deleteError,
      );

      // Verify task wasn't deleted after error
      expect(
        quizGenerationTaskRepositoryMock.softDelete,
      ).not.toHaveBeenCalled();
    });

    it("should propagate errors from task deletion", async () => {
      // Arrange - simulate error during task deletion
      const deleteError = new Error("Failed to delete task");
      quizGenerationTaskRepositoryMock.softDelete.mockRejectedValue(
        deleteError,
      );

      // Act & Assert
      await expect(useCase.execute({ userId, taskId })).rejects.toThrow(
        deleteError,
      );
    });
  });

  describe("Given a task has no questions", () => {
    // Mock data for task with no questions
    const mockUser = { getId: () => userId } as User;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
      getQuestions: () => [], // Empty questions array
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should skip answer deletion and only delete the task", async () => {
      // Act
      await useCase.execute({ userId, taskId });

      // Assert
      expect(
        answerRepositoryMock.softDeleteByQuestionId,
      ).not.toHaveBeenCalled();
      expect(questionRepositoryMock.softDeleteByTaskId).toHaveBeenCalledWith(
        taskId,
      );
      expect(quizGenerationTaskRepositoryMock.softDelete).toHaveBeenCalledWith(
        taskId,
      );
    });
  });
});
