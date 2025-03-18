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
  // Typed mocks for services and repositories
  type MockQuizGeneratorInstance = {
    generateQuestions: jest.Mock;
    generateQuestionsAndTitle: jest.Mock;
  };

  type MockQuizStorageInstance = {
    saveTask: jest.Mock;
    saveQuizData: jest.Mock;
    saveFailedTask: jest.Mock;
  };

  // Service mocks
  const MockedQuizGeneratorService = jest.mocked(QuizGeneratorService);
  const MockedQuizStorageService = jest.mocked(QuizStorageService);

  // Repository and service mocks
  let mockLLMService: jest.Mocked<LLMService>;
  let mockQuestionRepository: jest.Mocked<QuestionRepository>;
  let mockAnswerRepository: jest.Mocked<AnswerRepository>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  // Mock service instances with proper typing
  let mockQuizGeneratorInstance: MockQuizGeneratorInstance;
  let mockQuizStorageInstance: MockQuizStorageInstance;

  // Use case being tested
  let useCase: CreateQuizGenerationTaskUseCase;

  // Common test data
  const userId = faker.string.uuid();
  const mockUser = { getId: () => userId } as User;
  const defaultText = faker.lorem.paragraph(3);
  const mockTitle = faker.lorem.sentence();

  /**
   * Captures a task when saveTask is called to allow inspection in tests
   */
  const captureTask = () => {
    let capturedTask: QuizGenerationTask | null = null;
    mockQuizStorageInstance.saveTask.mockImplementation(
      (task: QuizGenerationTask) => {
        capturedTask = task;
        return Promise.resolve();
      },
    );
    return () => capturedTask;
  };

  /**
   * Helper function to set up and wait for async processes
   */
  const waitForAsyncProcessing = async (): Promise<void> => {
    await new Promise(process.nextTick);
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock repositories with proper typing
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
      findByUserId: jest.fn(),
    } as jest.Mocked<QuizGenerationTaskRepository>;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn(),
    } as jest.Mocked<UserRepository>;

    // Set up mock service instances with proper typing
    mockQuizGeneratorInstance = {
      generateQuestions: jest.fn(),
      generateQuestionsAndTitle: jest.fn(),
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

  describe("Input validation", () => {
    it("should reject text exceeding maximum length", async () => {
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

    it("should reject requests for non-existent users", async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(UserNotFoundError);

      // Verify no task creation occurred
      expect(mockQuizStorageInstance.saveTask).not.toHaveBeenCalled();
    });
  });

  describe("Task creation", () => {
    it("should create a task with correct initial properties", async () => {
      // Arrange
      const createTaskSpy = jest.spyOn(useCase as any, "createTask");
      const getTask = captureTask();
      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockImplementationOnce(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return Promise.resolve({ questions: [], title: mockTitle });
        },
      );

      // Act
      await useCase.execute({ userId, text: defaultText });
      const task = getTask();

      // Assert
      expect(createTaskSpy).toHaveBeenCalledWith(defaultText, userId);
      expect(task).not.toBeNull();

      // Need to be sure task exists to avoid TypeScript errors
      if (!task) {
        throw new Error("Task was not created");
      }

      expect(task.getStatus()).toEqual(QuizGenerationStatus.IN_PROGRESS);
      expect(task.getTextContent()).toEqual(defaultText);
      expect(task.getUserId()).toEqual(userId);
      expect(task.getQuestions()).toEqual([]);
      expect(task.getCreatedAt()).toBeInstanceOf(Date);
      expect(task.getUpdatedAt()).toBeInstanceOf(Date);
      expect(task.getId()).toMatch(/^[0-9a-f-]+$/i); // UUID format check

      // Clean up
      createTaskSpy.mockRestore();
    });
  });

  describe("Async processing", () => {
    it("should return immediately without waiting for quiz generation", async () => {
      // Arrange - Create a slow quiz generation
      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockImplementation(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { questions: [], title: mockTitle };
        },
      );

      const startTime = Date.now();

      // Act
      const result = await useCase.execute({ userId, text: defaultText });
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result.quizGenerationTask).toBeDefined();
      expect(executionTime).toBeLessThan(50); // Should return quickly
      expect(mockQuizStorageInstance.saveTask).toHaveBeenCalledTimes(1);
      expect(
        mockQuizGeneratorInstance.generateQuestionsAndTitle,
      ).toHaveBeenCalledTimes(1);
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

      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockResolvedValueOnce(
        {
          questions: mockQuestions,
          title: mockTitle,
        },
      );

      // Act
      await useCase.execute({ userId, text: defaultText });
      await waitForAsyncProcessing();

      // Assert
      expect(
        mockQuizGeneratorInstance.generateQuestionsAndTitle,
      ).toHaveBeenCalledTimes(1);
      expect(mockQuizStorageInstance.saveQuizData).toHaveBeenCalledTimes(1);
    });

    it("should update task to completed state after successful generation", async () => {
      // Arrange
      const mockQuestions = [
        new Question({
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: expect.any(String) as string,
        }),
      ];

      // Set up task and questions capture
      let capturedTask: QuizGenerationTask | null = null;
      let capturedQuestions: Question[] | null = null;

      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockResolvedValueOnce(
        {
          questions: mockQuestions,
          title: mockTitle,
        },
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
      await waitForAsyncProcessing();

      // Assert
      expect(capturedTask).not.toBeNull();
      if (!capturedTask) {
        throw new Error("Task was not captured");
      }

      expect((capturedTask as QuizGenerationTask).getStatus()).toBe(
        QuizGenerationStatus.COMPLETED,
      );
      expect((capturedTask as QuizGenerationTask).getTitle()).toBe(mockTitle);
      expect(capturedQuestions).toEqual(mockQuestions);
    });
    it("should update task to failed state when generation fails", async () => {
      // Arrange
      const generationError = new Error("Quiz generation failed");
      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockRejectedValueOnce(
        generationError,
      );

      // Set up task capture
      let failedTask: QuizGenerationTask | null = null;
      mockQuizStorageInstance.saveFailedTask.mockImplementation(
        (task: QuizGenerationTask) => {
          failedTask = task;
          return Promise.resolve();
        },
      );

      // Act
      await useCase.execute({ userId, text: defaultText });
      await waitForAsyncProcessing();

      // Assert
      expect(failedTask).not.toBeNull();
      if (!failedTask) {
        throw new Error("Failed task was not captured");
      }

      expect((failedTask as QuizGenerationTask).getStatus()).toBe(
        QuizGenerationStatus.FAILED,
      );
      expect(mockQuizStorageInstance.saveFailedTask).toHaveBeenCalledTimes(1);
    });

    it("should log errors without propagating them to caller", async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockRejectedValueOnce(
        new Error("Test error"),
      );

      // Act
      await useCase.execute({ userId, text: defaultText });
      await waitForAsyncProcessing();

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

      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockRejectedValueOnce(
        generationError,
      );
      mockQuizStorageInstance.saveFailedTask.mockRejectedValueOnce(saveError);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      await useCase.execute({ userId, text: defaultText });
      await waitForAsyncProcessing();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore console
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Service dependencies", () => {
    it("should properly initialize QuizGeneratorService with LLMService", () => {
      expect(MockedQuizGeneratorService).toHaveBeenCalledWith(mockLLMService);
    });

    it("should properly initialize QuizStorageService with all repositories", () => {
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

      // Assert
      expect(
        mockQuizGeneratorInstance.generateQuestionsAndTitle,
      ).toHaveBeenCalledWith(quizGenerationTask.getId(), defaultText);
    });

    it("should pass correct data to quiz storage when completed", async () => {
      // Arrange
      const mockQuestions = [
        new Question({
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: expect.any(String) as string,
        }),
      ];

      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockResolvedValueOnce(
        {
          questions: mockQuestions,
          title: mockTitle,
        },
      );

      // Act
      await useCase.execute({ userId, text: defaultText });
      await waitForAsyncProcessing();

      // Assert
      expect(mockQuizStorageInstance.saveQuizData).toHaveBeenCalledWith(
        expect.any(QuizGenerationTask),
        mockQuestions,
      );
    });
  });
});
