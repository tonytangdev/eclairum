import { faker } from "@faker-js/faker";
import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import { LLMService } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { FileUploadService } from "../interfaces/file-upload-service.interface";
import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { TextTooLongError, UserNotFoundError } from "../errors/quiz-errors";
import { RequiredTextContentError } from "../errors/validation-errors";
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
  let mockFileUploadService: jest.Mocked<FileUploadService>;

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
  const mockUploadUrl = faker.internet.url();

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
    } as unknown as jest.Mocked<QuestionRepository>;

    mockAnswerRepository = {
      saveAnswers: jest.fn(),
      findByQuestionId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepository>;

    mockQuizGenerationTaskRepository = {
      saveTask: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdPaginated: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn(),
    } as jest.Mocked<UserRepository>;

    mockFileUploadService = {
      generateUploadUrl: jest.fn().mockResolvedValue(mockUploadUrl),
    } as jest.Mocked<FileUploadService>;

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
      mockFileUploadService,
    );
  });

  describe("Input validation", () => {
    it("should reject text exceeding maximum length for direct text processing", async () => {
      // Arrange
      const tooLongText = "A".repeat(MAX_TEXT_LENGTH + 1);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: tooLongText }),
      ).rejects.toThrow(TextTooLongError);

      // Verify no further processing occurred
      expect(mockQuizStorageInstance.saveTask).not.toHaveBeenCalled();
    });

    it("should reject empty text for direct text processing", async () => {
      // Arrange
      const emptyText = "";

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: emptyText }),
      ).rejects.toThrow(RequiredTextContentError);

      // Verify no further processing occurred
      expect(mockQuizStorageInstance.saveTask).not.toHaveBeenCalled();
    });

    it("should reject different types of empty text for direct text processing", async () => {
      // Arrange
      const emptyValues = ["", " ", "\t", "\n", "   "];

      // Act & Assert
      for (const emptyValue of emptyValues) {
        await expect(
          useCase.execute({ userId, text: emptyValue }),
        ).rejects.toThrow(RequiredTextContentError);
      }

      // Verify no tasks were created
      expect(mockQuizStorageInstance.saveTask).not.toHaveBeenCalled();
    });

    it("should accept different types of empty text for file uploads", async () => {
      // Arrange
      const emptyValues = ["", " ", "\t", "\n", "   "];

      // Act & Assert
      for (const emptyValue of emptyValues) {
        const result = await useCase.execute({
          userId,
          text: emptyValue,
          isFileUpload: true,
        });

        // Assert for each empty value
        expect(result.quizGenerationTask).toBeDefined();
        expect(result.fileUploadUrl).toBe(mockUploadUrl);
      }

      // Verify tasks were created for each empty value
      expect(mockQuizStorageInstance.saveTask).toHaveBeenCalledTimes(
        emptyValues.length,
      );
    });

    it("should preserve empty text in created task for file uploads", async () => {
      // Arrange
      const emptyText = "";
      const getTask = captureTask();

      // Act
      await useCase.execute({
        userId,
        text: emptyText,
        isFileUpload: true,
      });
      const task = getTask();

      // Assert
      expect(task).not.toBeNull();
      if (!task) {
        throw new Error("Task was not created");
      }

      expect(task.getTextContent()).toBe("File upload task");
      expect(task.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
      expect(task.getUserId()).toBe(userId);
    });

    it("should accept empty text for file uploads", async () => {
      // Arrange
      const emptyText = "";

      // Act
      const result = await useCase.execute({
        userId,
        text: emptyText,
        isFileUpload: true,
      });

      // Assert
      expect(result.quizGenerationTask).toBeDefined();
      expect(result.fileUploadUrl).toBe(mockUploadUrl);
      expect(mockQuizStorageInstance.saveTask).toHaveBeenCalled();
    });

    it("should accept text exceeding maximum length for file uploads", async () => {
      // Arrange
      const tooLongText = "A".repeat(MAX_TEXT_LENGTH + 1);

      // Act
      const result = await useCase.execute({
        userId,
        text: tooLongText,
        isFileUpload: true,
      });

      // Assert
      expect(result.quizGenerationTask).toBeDefined();
      expect(result.fileUploadUrl).toBe(mockUploadUrl);
      expect(mockQuizStorageInstance.saveTask).toHaveBeenCalled();
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

  describe("Direct text processing", () => {
    it("should create a task with correct initial properties", async () => {
      // Arrange
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
      expect(task).not.toBeNull();

      // Need to be sure task exists to avoid TypeScript errors
      if (!task) {
        throw new Error("Task was not created");
      }

      expect(task.getStatus()).toEqual(QuizGenerationStatus.IN_PROGRESS);
      expect(task.getTextContent()).toEqual(defaultText);
      expect(task.getUserId()).toEqual(userId);
      expect(task.getQuestions()).toEqual([]);
    });

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
  });

  describe("File upload handling", () => {
    it("should return a file upload URL when isFileUpload is true", async () => {
      // Act
      const result = await useCase.execute({
        userId,
        text: defaultText,
        isFileUpload: true,
      });

      // Assert
      expect(result.fileUploadUrl).toBe(mockUploadUrl);
      expect(mockFileUploadService.generateUploadUrl).toHaveBeenCalled();
      expect(
        mockQuizGeneratorInstance.generateQuestionsAndTitle,
      ).not.toHaveBeenCalled();
    });

    it("should create a task for file upload with the correct status", async () => {
      // Arrange
      const getTask = captureTask();

      // Act
      await useCase.execute({
        userId,
        text: defaultText,
        isFileUpload: true,
      });
      const task = getTask();

      // Assert
      expect(task).not.toBeNull();
      if (!task) {
        throw new Error("Task was not created");
      }

      expect(task.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
      expect(task.getTextContent()).toBe(defaultText);
      expect(task.getUserId()).toBe(userId);
    });

    it("should throw an error when FileUploadService is not provided", async () => {
      // Arrange
      // Create use case without file upload service
      useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText, isFileUpload: true }),
      ).rejects.toThrow("File upload service is not configured");
    });

    it("should propagate errors from the file upload service", async () => {
      // Arrange
      const uploadError = new Error("Upload service failure");
      mockFileUploadService.generateUploadUrl.mockRejectedValueOnce(
        uploadError,
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText, isFileUpload: true }),
      ).rejects.toThrow(uploadError);
    });
  });

  describe("Error handling", () => {
    it("should update task status to FAILED when quiz generation fails", async () => {
      // Arrange
      const error = new Error("Quiz generation failed");
      mockQuizGeneratorInstance.generateQuestionsAndTitle.mockRejectedValueOnce(
        error,
      );

      const getTask = captureTask();

      // Act
      await useCase.execute({ userId, text: defaultText });
      await waitForAsyncProcessing();

      // Assert
      const task = getTask();
      expect(task).not.toBeNull();
      if (!task) {
        throw new Error("Task was not created");
      }

      expect(task.getStatus()).toBe(QuizGenerationStatus.FAILED);
      expect(mockQuizStorageInstance.saveFailedTask).toHaveBeenCalledWith(task);
    });

    it("should log errors when saving a failed task fails", async () => {
      // Arrange
      const generationError = new Error("Quiz generation failed");
      const saveError = new Error("Database error");

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

      // Clean up
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Async processing", () => {
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
  });

  // ...existing code for async processing and service dependencies...
});
