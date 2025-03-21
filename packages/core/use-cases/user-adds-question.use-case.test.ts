import { faker } from "@faker-js/faker";
import { UserAddsQuestionUseCase } from "./user-adds-question.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { User } from "../entities/user";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  InvalidQuestionError,
} from "../errors/quiz-errors";
import { Answer } from "../entities";

describe("UserAddsQuestionUseCase", () => {
  let useCase: UserAddsQuestionUseCase;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let quizGenerationTaskRepositoryMock: jest.Mocked<QuizGenerationTaskRepository>;
  let questionRepositoryMock: jest.Mocked<QuestionRepository>;
  let answerRepositoryMock: jest.Mocked<AnswerRepository>;

  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();
  const questionContent = "What is the capital of France?";
  const answers = [
    { content: "Paris", isCorrect: true },
    { content: "London", isCorrect: false },
    { content: "Berlin", isCorrect: false },
  ];

  beforeEach(() => {
    // Setup repository mocks
    userRepositoryMock = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    quizGenerationTaskRepositoryMock = {
      findById: jest.fn(),
      saveTask: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    questionRepositoryMock = {
      save: jest.fn(),
    } as unknown as jest.Mocked<QuestionRepository>;

    answerRepositoryMock = {
      saveAnswers: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepository>;

    // Create the use case with mocked repositories
    useCase = new UserAddsQuestionUseCase(
      userRepositoryMock,
      quizGenerationTaskRepositoryMock,
      questionRepositoryMock,
      answerRepositoryMock,
    );
  });

  describe("Given a valid user and task", () => {
    const mockUser = { getId: () => userId } as User;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
      addQuestion: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTask>;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
      questionRepositoryMock.save.mockImplementation((question) =>
        Promise.resolve(question),
      );
      answerRepositoryMock.saveAnswers.mockImplementation(() =>
        Promise.resolve(),
      );
    });

    it("should successfully add a question to the task", async () => {
      // Act
      const result = await useCase.execute({
        userId,
        taskId,
        questionContent,
        answers,
      });

      // Assert
      expect(result.question).toBeDefined();
      expect(result.question.getContent()).toBe(questionContent);
      expect(result.question.getQuizGenerationTaskId()).toBe(taskId);

      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
      expect(quizGenerationTaskRepositoryMock.findById).toHaveBeenCalledWith(
        taskId,
      );
      expect(questionRepositoryMock.save).toHaveBeenCalled();
      expect(answerRepositoryMock.saveAnswers).toHaveBeenCalled();
      expect(mockTask.addQuestion).toHaveBeenCalled();
      expect(quizGenerationTaskRepositoryMock.saveTask).toHaveBeenCalledWith(
        mockTask,
      );

      // Verify answers were created correctly
      const savedAnswers = answerRepositoryMock.saveAnswers.mock.calls[0][0];
      expect(savedAnswers).toHaveLength(3);
      expect(savedAnswers[0].getContent()).toBe("Paris");
      expect(savedAnswers[0].getIsCorrect()).toBe(true);
    });
  });

  describe("Given validation scenarios", () => {
    const mockUser = { getId: () => userId } as User;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
      addQuestion: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTask>;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should throw InvalidQuestionError when question content is empty", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent: "",
          answers,
        }),
      ).rejects.toThrow(InvalidQuestionError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });

    it("should throw InvalidQuestionError when less than two answers are provided", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers: [{ content: "Paris", isCorrect: true }],
        }),
      ).rejects.toThrow(InvalidQuestionError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });

    it("should throw InvalidQuestionError when no correct answer is provided", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers: [
            { content: "Paris", isCorrect: false },
            { content: "London", isCorrect: false },
          ],
        }),
      ).rejects.toThrow(InvalidQuestionError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });

    it("should throw InvalidQuestionError when an answer has empty content", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers: [
            { content: "Paris", isCorrect: true },
            { content: "", isCorrect: false },
          ],
        }),
      ).rejects.toThrow(InvalidQuestionError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given the user does not exist", () => {
    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw UserNotFoundError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers,
        }),
      ).rejects.toThrow(UserNotFoundError);

      expect(quizGenerationTaskRepositoryMock.findById).not.toHaveBeenCalled();
      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given the task does not exist", () => {
    const mockUser = { getId: () => userId } as User;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(null);
    });

    it("should throw TaskNotFoundError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers,
        }),
      ).rejects.toThrow(TaskNotFoundError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given the task belongs to a different user", () => {
    const mockUser = { getId: () => userId } as User;
    const differentUserId = faker.string.uuid();
    const mockTask = {
      getId: () => taskId,
      getUserId: () => differentUserId,
    } as unknown as QuizGenerationTask;

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should throw UnauthorizedTaskAccessError", async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers,
        }),
      ).rejects.toThrow(UnauthorizedTaskAccessError);

      expect(questionRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe("Given an error during saving", () => {
    const mockUser = { getId: () => userId } as User;
    const mockTask = {
      getId: () => taskId,
      getUserId: () => userId,
      addQuestion: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTask>;
    const dbError = new Error("Database error");

    beforeEach(() => {
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      quizGenerationTaskRepositoryMock.findById.mockResolvedValue(mockTask);
    });

    it("should propagate errors from question repository", async () => {
      // Arrange
      questionRepositoryMock.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers,
        }),
      ).rejects.toThrow(dbError);

      expect(answerRepositoryMock.saveAnswers).not.toHaveBeenCalled();
    });

    it("should propagate errors from answer repository", async () => {
      // Arrange
      questionRepositoryMock.save.mockImplementation((question) =>
        Promise.resolve(question),
      );
      answerRepositoryMock.saveAnswers.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          taskId,
          questionContent,
          answers,
        }),
      ).rejects.toThrow(dbError);

      expect(quizGenerationTaskRepositoryMock.saveTask).not.toHaveBeenCalled();
    });
  });
});
