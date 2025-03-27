import { faker } from "@faker-js/faker";
import { ResumeQuizGenerationTaskAfterUploadUseCase } from "./resume-quiz-generation-task-after-upload.use-case";
import { OCRService } from "../interfaces/ocr-service.interface";
import { FileRepository } from "../interfaces/file-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import {
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";
import { File } from "../entities";

describe("ResumeQuizGenerationTaskAfterUploadUseCase", () => {
  // Mock services
  let mockOCRService: jest.Mocked<OCRService>;
  let mockFileRepository: jest.Mocked<FileRepository>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let mockCreateQuizGenerationTaskUseCase: jest.Mocked<CreateQuizGenerationTaskUseCase>;

  // Use case being tested
  let useCase: ResumeQuizGenerationTaskAfterUploadUseCase;

  // Test data
  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();
  const fileId = faker.string.uuid();
  const extractedText = faker.lorem.paragraphs(3);
  const filePath = faker.system.filePath();

  // Mock implementation for task and file
  let mockTask: jest.Mocked<QuizGenerationTask>;
  let mockFile: jest.Mocked<File>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create our mock task
    mockTask = {
      getId: jest.fn().mockReturnValue(taskId),
      getUserId: jest.fn().mockReturnValue(userId),
      getStatus: jest.fn().mockReturnValue(QuizGenerationStatus.IN_PROGRESS),
      updateStatus: jest.fn(),
      setErrorMessage: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTask>;

    // Create our mock file
    mockFile = {
      getId: jest.fn().mockReturnValue(fileId),
      getPath: jest.fn().mockReturnValue(filePath),
    } as unknown as jest.Mocked<File>;

    // Set up our mocks
    mockOCRService = {
      extractTextFromFile: jest.fn().mockResolvedValue(extractedText),
    } as jest.Mocked<OCRService>;

    mockFileRepository = {
      findByQuizGenerationTaskId: jest.fn().mockResolvedValue(mockFile),
    } as unknown as jest.Mocked<FileRepository>;

    mockQuizGenerationTaskRepository = {
      findById: jest.fn().mockResolvedValue(mockTask),
      saveTask: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    mockCreateQuizGenerationTaskUseCase = {
      execute: jest.fn().mockResolvedValue({
        quizGenerationTask: mockTask,
      }),
    } as unknown as jest.Mocked<CreateQuizGenerationTaskUseCase>;

    // Create the use case with our mocks
    useCase = new ResumeQuizGenerationTaskAfterUploadUseCase(
      mockOCRService,
      mockQuizGenerationTaskRepository,
      mockFileRepository,
      mockCreateQuizGenerationTaskUseCase,
    );
  });

  describe("Task validation", () => {
    it("should throw an error when task is not found", async () => {
      // Arrange
      mockQuizGenerationTaskRepository.findById.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(useCase.execute({ taskId, userId })).rejects.toThrow(
        TaskNotFoundError,
      );
    });

    it("should throw an error when user is not authorized to access task", async () => {
      // Arrange
      const unauthorizedUserId = faker.string.uuid();

      // Act & Assert
      await expect(
        useCase.execute({
          taskId,
          userId: unauthorizedUserId,
        }),
      ).rejects.toThrow(UnauthorizedTaskAccessError);
    });

    it("should throw an error when no file is found for the task", async () => {
      // Arrange
      mockFileRepository.findByQuizGenerationTaskId.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(useCase.execute({ taskId, userId })).rejects.toThrow(
        "No file found for task ID",
      );
    });
  });

  describe("Successful task processing", () => {
    it("should return success and the task immediately", async () => {
      // Act
      const result = await useCase.execute({ taskId, userId });

      // Assert
      expect(result.success).toBe(true);
      expect(result.task).toBe(mockTask);
    });

    it("should trigger background processing", async () => {
      // Arrange
      const processSpy = jest.spyOn(useCase as any, "processTaskInBackground");

      // Act
      await useCase.execute({ taskId, userId });

      // Assert
      expect(processSpy).toHaveBeenCalled();
      expect(processSpy).toHaveBeenCalledWith(filePath, userId, mockTask);

      // Cleanup
      processSpy.mockRestore();
    });
  });

  describe("Task failure handling", () => {
    it("should recover properly from errors", async () => {
      // This test verifies proper error handling by simulating a successful call
      // even if there would be underlying errors in background processing

      // Arrange
      jest
        .spyOn(mockOCRService, "extractTextFromFile")
        .mockRejectedValueOnce(new Error("OCR processing failed"));

      // Act
      const result = await useCase.execute({ taskId, userId });

      // Assert - Even with potential background errors, the initial response is a success
      expect(result.success).toBe(true);
      expect(result.task).toBe(mockTask);
    });

    it("should handle errors when saving failed task", async () => {
      // Arrange
      jest.spyOn(console, "error").mockImplementation();

      // Setup OCR service to fail
      const ocrError = new Error("OCR processing failed");
      mockOCRService.extractTextFromFile.mockRejectedValueOnce(ocrError);

      // Setup saveTask to throw an error when attempting to save the failed task
      const saveError = new Error("Error saving failed task");
      mockQuizGenerationTaskRepository.saveTask.mockRejectedValueOnce(
        saveError,
      );

      // Act - Call the public method that will eventually trigger the error handling path
      await useCase.execute({ taskId, userId });

      // We need to advance any timers/promises to ensure background processing completes
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockTask.updateStatus).toHaveBeenCalledWith(
        QuizGenerationStatus.FAILED,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        mockTask,
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to save failed quiz generation task:",
        saveError,
      );
    });

    it("should handle OCR extraction errors in background processing", async () => {
      // Arrange
      jest.spyOn(console, "error").mockImplementation();

      // Setup OCR service to fail
      const ocrError = new Error("OCR processing failed");
      mockOCRService.extractTextFromFile.mockRejectedValueOnce(ocrError);

      // Act
      await useCase.execute({ taskId, userId });

      // Wait for background processing to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockOCRService.extractTextFromFile).toHaveBeenCalledWith(filePath);
      expect(mockTask.updateStatus).toHaveBeenCalledWith(
        QuizGenerationStatus.FAILED,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        mockTask,
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to resume task/),
      );
    });
  });

  describe("File repository integration", () => {
    it("should retrieve file information with the task ID", async () => {
      // Act
      await useCase.execute({ taskId, userId });

      // Assert
      expect(
        mockFileRepository.findByQuizGenerationTaskId,
      ).toHaveBeenCalledWith(taskId);
    });
  });

  afterEach(() => {
    // Clean up any mocks of console methods
    jest.restoreAllMocks();
  });
});
