import { faker } from "@faker-js/faker";
import { UserEditsQuestionUseCase } from "./user-edits-question.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { User } from "../entities/user";
import { Question } from "../entities/question";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  InvalidQuestionError,
} from "../errors/quiz-errors";

describe("UserEditsQuestionUseCase", () => {
  let useCase: UserEditsQuestionUseCase;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let questionRepositoryMock: jest.Mocked<QuestionRepository>;
  let quizGenerationTaskRepositoryMock: jest.Mocked<QuizGenerationTaskRepository>;

  // Test data
  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();
  const questionId = faker.string.uuid();
  const originalContent = "What is the capital of France?";
  const updatedContent = "What is the largest city in France?";

  beforeEach(() => {
    // Setup repository mocks
    userRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    questionRepositoryMock = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<QuestionRepository>;

    quizGenerationTaskRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    // Create the use case with mocked repositories
    useCase = new UserEditsQuestionUseCase(
      userRepositoryMock,
      questionRepositoryMock,
      quizGenerationTaskRepositoryMock,
    );
  });

  describe("Given a valid user, question, and task relationship", () => {
    // Setup common test objects
    const mockUser = { getId: () => userId } as User;
    const mockQuestion = {
      getId: () => questionId,
      getQuizGenerationTaskId: () => taskId,
      getContent: () => originalContent,
      setContent: jest.fn(),
    } as unknown as jest.Mocked<Question>;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      // Setup successful validation scenarios
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      questionRepositoryMock.findById.mockResolvedValue(mockQuestion);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
      questionRepositoryMock.save.mockImplementation((question) =>
        Promise.resolve(question),
      );
    });

    it("should successfully update the question content", async () => {
      // Act
      const result = await useCase.execute({
        userId,
        questionId,
        questionContent: updatedContent,
      });

      // Assert
      expect(result.question).toBe(mockQuestion);

      // Check validations were called
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(questionRepositoryMock.findById).toHaveBeenCalledWith(questionId);
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );

      // Check question was updated
      expect(mockQuestion.setContent).toHaveBeenCalledWith(updatedContent);
      expect(questionRepositoryMock.save).toHaveBeenCalledWith(mockQuestion);
    });
  });

  describe("Given validation scenarios", () => {
    const mockUser = { getId: () => userId } as User;
    const mockQuestion = {
      getId: () => questionId,
      getQuizGenerationTaskId: () => taskId,
      getContent: () => originalContent,
      setContent: jest.fn(),
    } as unknown as jest.Mocked<Question>;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      questionRepositoryMock.findById.mockResolvedValue(mockQuestion);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should throw InvalidQuestionError when question content is empty", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          questionId,
          questionContent: "",
        }),
      ).rejects.toThrow(InvalidQuestionError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given a user does not exist", () => {
    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw UserNotFoundError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          questionId,
          questionContent: updatedContent,
        }),
      ).rejects.toThrow(UserNotFoundError);

      expect(questionRepositoryMock.findById).not.toHaveBeenCalled();
    });
  });

  describe("Given a question does not exist", () => {
    const mockUser = { getId: () => userId } as User;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      questionRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw InvalidQuestionError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          questionId,
          questionContent: updatedContent,
        }),
      ).rejects.toThrow(InvalidQuestionError);

      expect(quizGenerationTaskRepositoryMock.findById).not.toHaveBeenCalled();
    });
  });

  describe("Given a task does not exist", () => {
    const mockUser = { getId: () => userId } as User;
    const mockQuestion = {
      getId: () => questionId,
      getQuizGenerationTaskId: () => taskId,
    } as unknown as Question;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      questionRepositoryMock.findById.mockResolvedValue(mockQuestion);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw TaskNotFoundError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          questionId,
          questionContent: updatedContent,
        }),
      ).rejects.toThrow(TaskNotFoundError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given a task belongs to a different user", () => {
    const mockUser = { getId: () => userId } as User;
    const mockQuestion = {
      getId: () => questionId,
      getQuizGenerationTaskId: () => taskId,
    } as unknown as Question;
    const differentUserId = faker.string.uuid();
    const mockTask = {
      getId: () => taskId,
      getUserId: () => differentUserId,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      questionRepositoryMock.findById.mockResolvedValue(mockQuestion);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should throw UnauthorizedTaskAccessError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          questionId,
          questionContent: updatedContent,
        }),
      ).rejects.toThrow(UnauthorizedTaskAccessError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given errors during the update process", () => {
    const mockUser = { getId: () => userId } as User;
    const mockQuestion = {
      getId: () => questionId,
      getQuizGenerationTaskId: () => taskId,
      getContent: () => originalContent,
      setContent: jest.fn(),
    } as unknown as jest.Mocked<Question>;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
    } as unknown as QuizGenerationTask;
    const dbError = new Error("Database error");

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      questionRepositoryMock.findById.mockResolvedValue(mockQuestion);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should propagate errors from question repository", async () => {
      // Arrange
      questionRepositoryMock.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          questionId,
          questionContent: updatedContent,
        }),
      ).rejects.toThrow(dbError);
    });
  });
});
