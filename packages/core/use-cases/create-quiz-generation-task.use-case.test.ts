import { faker } from "@faker-js/faker";
import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
import { User, File } from "../entities";
import { TextTooLongError, UserNotFoundError } from "../errors/quiz-errors";
import { RequiredTextContentError } from "../errors/validation-errors";
import { MAX_TEXT_LENGTH } from "../constants/quiz";
import { LLMService } from "../interfaces/llm-service.interface";

describe("CreateQuizGenerationTaskUseCase", () => {
  // Mock dependencies with proper typing
  const mockLLMService: jest.Mocked<LLMService> = {
    generateQuiz: jest.fn(),
  };

  const mockQuestionRepository = {
    saveQuestions: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByQuizGenerationTaskId: jest.fn(),
    save: jest.fn(),
    softDeleteByTaskId: jest.fn(),
  };

  const mockAnswerRepository = {
    saveAnswers: jest.fn(),
    findByQuestionId: jest.fn(),
    findById: jest.fn(),
    softDeleteByQuestionId: jest.fn(),
    save: jest.fn(),
  };

  const mockQuizGenerationTaskRepository = {
    saveTask: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByUserIdPaginated: jest.fn(),
    findAll: jest.fn(),
    softDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };

  const mockFileRepository = {
    findById: jest.fn(),
    findByQuizGenerationTaskId: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockFileUploadService = {
    generateUploadUrl: jest.fn(),
  };

  // Test utility functions
  const createValidUser = (): User => {
    return new User({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };
  const createValidFile = (taskId: string): File => {
    return new File({
      path: faker.system.filePath(),
      bucketName: faker.word.sample(),
      quizGenerationTaskId: taskId,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock responses
    mockUserRepository.findById.mockResolvedValue(createValidUser());
    mockQuizGenerationTaskRepository.saveTask.mockResolvedValue(undefined);

    mockFileUploadService.generateUploadUrl.mockResolvedValue(
      "https://example.com/upload-url",
    );
    mockFileRepository.save.mockResolvedValue(
      createValidFile(faker.string.uuid()),
    );
  });

  describe("Text-based quiz generation", () => {
    it("should create a quiz generation task with provided text", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
      );

      const userId = faker.string.uuid();
      const text = faker.lorem.paragraph();

      // Act
      const result = await useCase.execute({ userId, text });

      // Assert
      expect(result.quizGenerationTask).toBeInstanceOf(QuizGenerationTask);
      expect(result.quizGenerationTask.getUserId()).toBe(userId);
      expect(result.quizGenerationTask.getTextContent()).toBe(text);
      expect(result.quizGenerationTask.getStatus()).toBe(
        QuizGenerationStatus.IN_PROGRESS,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        expect.any(QuizGenerationTask),
      );
      expect(result.fileUploadUrl).toBeUndefined();
    });

    it("should throw RequiredTextContentError if text is empty", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
      );

      const userId = faker.string.uuid();
      const text = "";

      // Act & Assert
      await expect(useCase.execute({ userId, text })).rejects.toThrow(
        RequiredTextContentError,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).not.toHaveBeenCalled();
    });

    it("should throw TextTooLongError if text exceeds max length", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
      );

      const userId = faker.string.uuid();
      const text = "a".repeat(MAX_TEXT_LENGTH + 1);

      // Act & Assert
      await expect(useCase.execute({ userId, text })).rejects.toThrow(
        TextTooLongError,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).not.toHaveBeenCalled();
    });

    it("should throw UserNotFoundError if user doesn't exist", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
      );

      const userId = faker.string.uuid();
      const text = faker.lorem.paragraph();

      // Mock user not found
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ userId, text })).rejects.toThrow(
        UserNotFoundError,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).not.toHaveBeenCalled();
    });
  });

  describe("File upload handling", () => {
    it("should generate a file upload URL when isFileUpload is true", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
        mockFileRepository,
        mockFileUploadService,
      );

      const userId = faker.string.uuid();
      const text = "File upload description";

      // Act
      const result = await useCase.execute({
        userId,
        text,
        isFileUpload: true,
      });

      // Assert
      expect(result.quizGenerationTask).toBeInstanceOf(QuizGenerationTask);
      expect(result.quizGenerationTask.getUserId()).toBe(userId);
      expect(result.fileUploadUrl).toBe("https://example.com/upload-url");
      expect(mockFileUploadService.generateUploadUrl).toHaveBeenCalledWith(
        result.quizGenerationTask.getId(),
      );
    });

    it("should handle an existing file when path and bucket are provided", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
        mockFileRepository,
        mockFileUploadService,
      );

      const userId = faker.string.uuid();
      const text = "File upload with existing file";
      const filePath = "documents/sample.pdf";
      const bucketName = "user-files";

      // Act
      const result = await useCase.execute({
        userId,
        text,
        isFileUpload: true,
        filePath,
        bucketName,
      });

      // Assert
      expect(result.quizGenerationTask).toBeInstanceOf(QuizGenerationTask);
      expect(mockFileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          path: filePath,
          bucketName: bucketName,
          quizGenerationTaskId: result.quizGenerationTask.getId(),
        }),
      );
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledTimes(
        2,
      ); // Initial save + after setting file
      expect(result.fileUploadUrl).toBeUndefined();
    });

    it("should throw an error when file repository is not configured", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
        undefined, // No file repository
        mockFileUploadService,
      );

      const userId = faker.string.uuid();
      const text = "File upload with existing file";
      const filePath = "documents/sample.pdf";
      const bucketName = "user-files";

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          text,
          isFileUpload: true,
          filePath,
          bucketName,
        }),
      ).rejects.toThrow("File repository is not configured");
    });

    it("should throw an error when file upload service is not configured", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
        mockFileRepository,
        undefined, // No file upload service
      );

      const userId = faker.string.uuid();
      const text = "File upload test";

      // Act & Assert
      await expect(
        useCase.execute({
          userId,
          text,
          isFileUpload: true,
        }),
      ).rejects.toThrow("File upload service is not configured");
    });

    it("should use empty string as default text for file uploads when text is not provided", async () => {
      // Arrange
      const useCase = new CreateQuizGenerationTaskUseCase(
        mockLLMService,
        mockQuestionRepository,
        mockAnswerRepository,
        mockQuizGenerationTaskRepository,
        mockUserRepository,
        mockFileRepository,
        mockFileUploadService,
      );

      const userId = faker.string.uuid();

      // Act
      const result = await useCase.execute({
        userId,
        text: "",
        isFileUpload: true,
      });

      // Assert
      expect(result.quizGenerationTask.getTextContent()).toBe(
        "File upload task",
      );
      expect(mockFileUploadService.generateUploadUrl).toHaveBeenCalledWith(
        result.quizGenerationTask.getId(),
      );
    });
  });
});
