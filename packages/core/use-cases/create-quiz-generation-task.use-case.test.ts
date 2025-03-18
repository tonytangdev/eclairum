import { faker } from "@faker-js/faker";
import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import { LLMService } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { TextTooLongError, UserNotFoundError } from "../errors/quiz-errors";
import { User } from "../entities/user";
import { MAX_TEXT_LENGTH } from "../constants/quiz";
import { QuizGeneratorService } from "../services/quiz-generator.service";
import { QuizStorageService } from "../services/quiz-storage.service";

// Mock the service classes
jest.mock("../services/quiz-generator.service");
jest.mock("../services/quiz-storage.service");

describe("CreateQuizGenerationTaskUseCase", () => {
  // Service mocks
  const MockedQuizGeneratorService = jest.mocked(QuizGeneratorService);
  const MockedQuizStorageService = jest.mocked(QuizStorageService);

  // Repository and service mocks
  let mockLLMService: jest.Mocked<LLMService>;
  let mockQuestionRepository: jest.Mocked<QuestionRepository>;
  let mockAnswerRepository: jest.Mocked<AnswerRepository>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  // Mock service instances that will be returned from constructors
  let mockQuizGeneratorInstance: {
    generateQuestions: jest.Mock;
  };

  let mockQuizStorageInstance: {
    saveTask: jest.Mock;
    saveQuizData: jest.Mock;
    saveFailedTask: jest.Mock;
  };

  // Use case being tested
  let useCase: CreateQuizGenerationTaskUseCase;

  // Common test data
  const userId = faker.string.uuid();
  const mockUser = { getId: () => userId } as User;
  const defaultText = faker.lorem.paragraph(3);

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock repositories
    mockLLMService = {
      generateQuiz: jest.fn(),
    } as jest.Mocked<LLMService>;

    mockQuestionRepository = {
      saveQuestions: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<QuestionRepository>;

    mockAnswerRepository = {
      saveAnswers: jest.fn(),
      findByQuestionId: jest.fn(),
      findById: jest.fn(),
    } as jest.Mocked<AnswerRepository>;

    mockQuizGenerationTaskRepository = {
      saveTask: jest.fn(),
    } as jest.Mocked<QuizGenerationTaskRepository>;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn(),
    } as jest.Mocked<UserRepository>;

    // Set up mock service instances
    mockQuizGeneratorInstance = {
      generateQuestions: jest.fn(),
    };

    mockQuizStorageInstance = {
      saveTask: jest.fn(),
      saveQuizData: jest.fn(),
      saveFailedTask: jest.fn(),
    };

    // Configure mock constructors to return our instances
    MockedQuizGeneratorService.mockImplementation(
      () => mockQuizGeneratorInstance as unknown as QuizGeneratorService,
    );
    MockedQuizStorageService.mockImplementation(
      () => mockQuizStorageInstance as unknown as QuizStorageService,
    );

    // Create the use case
    useCase = new CreateQuizGenerationTaskUseCase(
      mockLLMService,
      mockQuestionRepository,
      mockAnswerRepository,
      mockQuizGenerationTaskRepository,
      mockUserRepository,
    );
  });

  describe("Task creation and validation", () => {
    it("should validate text length", async () => {
      // Arrange
      const tooLongText = "A".repeat(MAX_TEXT_LENGTH + 1);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: tooLongText }),
      ).rejects.toThrow(TextTooLongError);

      // Verify no further processing occurred
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockQuizStorageInstance.saveTask).not.toHaveBeenCalled();
    });

    it("should validate user exists", async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(UserNotFoundError);

      // Verify no task creation occurred
      expect(mockQuizStorageInstance.saveTask).not.toHaveBeenCalled();
    });

    it.skip("should create a task with correct initial state", async () => {
      // Arrange
      // Spy on the createTask method to verify the initial status set by the use case
      const createTaskSpy = jest.spyOn(useCase as any, "createTask");

      let capturedTask: QuizGenerationTask | null = null;
      mockQuizStorageInstance.saveTask.mockImplementation(
        (task: QuizGenerationTask) => {
          capturedTask = task;
          return Promise.resolve();
        },
      );

      // mock questions to be returned by the generator
      const mockQuestions = [];

      mockQuizGeneratorInstance.generateQuestions.mockResolvedValueOnce(
        mockQuestions,
      );

      // Act
      await useCase.execute({ userId, text: defaultText });

      // Assert
      expect(createTaskSpy).toHaveBeenCalledWith(defaultText, userId);
      expect(capturedTask).not.toBeNull();

      // Verify the task is created with IN_PROGRESS status as set in the createTask method
      // Note: The entity has a PENDING default but the use case explicitly sets IN_PROGRESS
      expect(capturedTask!.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
      expect(capturedTask!.getTextContent()).toBe(defaultText);
      expect(capturedTask!.getUserId()).toBe(userId);
      expect(capturedTask!.getQuestions()).toHaveLength(0);

      // Clean up the spy
      createTaskSpy.mockRestore();
    });
  });

  describe("Async processing", () => {
    it("should immediately save and return the task without waiting for quiz generation", async () => {
      // Arrange - Create a slow quiz generation
      const delay = new Promise((resolve) => setTimeout(resolve, 100));
      mockQuizGeneratorInstance.generateQuestions.mockImplementation(
        async () => {
          await delay;
          return [] as Question[];
        },
      );

      const startTime = Date.now();

      // Act
      const result = await useCase.execute({ userId, text: defaultText });

      const executionTime = Date.now() - startTime;

      // Assert
      expect(result.quizGenerationTask).toBeDefined();
      expect(executionTime).toBeLessThan(50); // Should return quickly without waiting
      expect(mockQuizStorageInstance.saveTask).toHaveBeenCalledTimes(1);
      expect(mockQuizGeneratorInstance.generateQuestions).toHaveBeenCalledTimes(
        1,
      );
    });

    it("should process quiz generation asynchronously", async () => {
      // Arrange
      const mockQuestions = [
        new Question({
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: expect.any(String) as string,
        }),
      ];

      mockQuizGeneratorInstance.generateQuestions.mockResolvedValueOnce(
        mockQuestions,
      );

      // Act
      await useCase.execute({ userId, text: defaultText });

      // Wait for async processes (simulating process.nextTick)
      await new Promise(process.nextTick);

      // Assert
      expect(mockQuizGeneratorInstance.generateQuestions).toHaveBeenCalledTimes(
        1,
      );
      expect(mockQuizStorageInstance.saveQuizData).toHaveBeenCalledTimes(1);
    });

    it("should update the task state when quiz generation completes successfully", async () => {
      // Arrange
      const mockQuestions = [
        new Question({
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: expect.any(String) as string,
        }),
      ];

      // Capture the task to verify its final state
      let capturedTask: QuizGenerationTask | null = null;
      let capturedQuestions: Question[] | null = null;

      mockQuizGeneratorInstance.generateQuestions.mockResolvedValueOnce(
        mockQuestions,
      );
      mockQuizStorageInstance.saveQuizData.mockImplementation(
        (task: QuizGenerationTask, questions: Question[]) => {
          capturedTask = task;
          capturedQuestions = questions;
          return Promise.resolve();
        },
      );

      // Act
      await useCase.execute({ userId, text: defaultText });

      // Wait for async processes
      await new Promise(process.nextTick);

      // Assert
      expect(capturedTask).not.toBeNull();
      expect(capturedTask!.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
      expect(capturedQuestions).toEqual(mockQuestions);
    });

    it("should handle quiz generation failures by saving failed status", async () => {
      // Arrange
      const error = new Error("Quiz generation failed");
      mockQuizGeneratorInstance.generateQuestions.mockRejectedValueOnce(error);

      // Capture the task to verify its state on failure
      let capturedTask: QuizGenerationTask | null = null;
      mockQuizStorageInstance.saveFailedTask.mockImplementation(
        (task: QuizGenerationTask) => {
          capturedTask = task;
          return Promise.resolve();
        },
      );

      // Act - Start the process
      await useCase.execute({ userId, text: defaultText });

      // Wait for async processes
      await new Promise(process.nextTick);

      // Assert
      expect(capturedTask).not.toBeNull();
      expect(capturedTask!.getStatus()).toBe(QuizGenerationStatus.FAILED);
      expect(mockQuizStorageInstance.saveFailedTask).toHaveBeenCalledTimes(1);
    });

    it("should log but not propagate errors during async processing", async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockQuizGeneratorInstance.generateQuestions.mockRejectedValueOnce(
        new Error("Test error"),
      );

      // Act
      await useCase.execute({ userId, text: defaultText });

      // Wait for async processes
      await new Promise(process.nextTick);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain(
        "Error during async quiz generation",
      );

      // Restore console
      consoleErrorSpy.mockRestore();
    });

    it("should handle errors when saving failed tasks", async () => {
      // Arrange
      const generationError = new Error("Quiz generation failed");
      const saveError = new Error("Database connection error");

      // Make quiz generation fail
      mockQuizGeneratorInstance.generateQuestions.mockRejectedValueOnce(
        generationError,
      );

      // Make saving the failed task also fail
      mockQuizStorageInstance.saveFailedTask.mockRejectedValueOnce(saveError);

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      await useCase.execute({ userId, text: defaultText });

      // Wait for async processes
      await new Promise(process.nextTick);

      // Assert
      // Verify that the specific error message for failed save was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save failed quiz generation task:",
        saveError,
      );

      // Also verify that the original error is also logged (from the catch block in processQuizGeneration)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error during async quiz generation"),
      );

      // Restore console
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Service interactions", () => {
    it("should initialize QuizGeneratorService with LLMService", () => {
      // Assert
      expect(MockedQuizGeneratorService).toHaveBeenCalledWith(mockLLMService);
    });

    it("should initialize QuizStorageService with all repositories", () => {
      // Assert
      expect(MockedQuizStorageService).toHaveBeenCalledWith(
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
      );
    });

    it("should pass correct parameters to quiz generator", async () => {
      // Act
      const { quizGenerationTask } = await useCase.execute({
        userId,
        text: defaultText,
      });

      // Wait for async processes
      await new Promise(process.nextTick);

      // Assert
      expect(mockQuizGeneratorInstance.generateQuestions).toHaveBeenCalledWith(
        quizGenerationTask.getId(),
        defaultText,
      );
    });

    it("should pass correct parameters to quiz storage for completed tasks", async () => {
      // Arrange
      const mockQuestions = [
        new Question({
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: expect.any(String) as string,
        }),
      ];
      mockQuizGeneratorInstance.generateQuestions.mockResolvedValueOnce(
        mockQuestions,
      );

      // Act
      await useCase.execute({
        userId,
        text: defaultText,
      });

      // Wait for async processes
      await new Promise(process.nextTick);

      // Assert
      expect(mockQuizStorageInstance.saveQuizData).toHaveBeenCalledWith(
        expect.any(QuizGenerationTask),
        mockQuestions,
      );
    });
  });
});
