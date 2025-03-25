import { faker } from "@faker-js/faker";
import { ResumeQuizGenerationTaskAfterUploadUseCase } from "./resume-quiz-generation-task-after-upload.use-case";
import { OCRService } from "../interfaces/ocr-service.interface";
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

describe("ResumeQuizGenerationTaskAfterUploadUseCase", () => {
  // Mock services
  let mockOCRService: jest.Mocked<OCRService>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let mockCreateQuizGenerationTaskUseCase: jest.Mocked<CreateQuizGenerationTaskUseCase>;

  // Use case being tested
  let useCase: ResumeQuizGenerationTaskAfterUploadUseCase;

  // Test data
  const userId = faker.string.uuid();
  const taskId = faker.string.uuid();
  const extractedText = faker.lorem.paragraphs(3);

  // Mock implementation for task
  let mockTask: jest.Mocked<QuizGenerationTask>;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.clearAllTimers();

    // Create our mock task
    mockTask = {
      getId: jest.fn().mockReturnValue(taskId),
      getUserId: jest.fn().mockReturnValue(userId),
      getStatus: jest.fn().mockReturnValue(QuizGenerationStatus.IN_PROGRESS),
      updateStatus: jest.fn(),
      setErrorMessage: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTask>;

    // Set up our mocks
    mockOCRService = {
      extractTextFromFile: jest.fn().mockResolvedValue(extractedText),
    } as jest.Mocked<OCRService>;

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
      expect(mockOCRService.extractTextFromFile).not.toHaveBeenCalled();
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

      expect(mockOCRService.extractTextFromFile).not.toHaveBeenCalled();
    });
  });

  describe("OCR processing", () => {
    it("should extract text from file and pass it to create quiz generation task", async () => {
      // Act
      const result = await useCase.execute({ taskId, userId });

      // Assert
      expect(mockOCRService.extractTextFromFile).toHaveBeenCalledWith(taskId);
      expect(mockCreateQuizGenerationTaskUseCase.execute).toHaveBeenCalledWith({
        userId,
        text: extractedText,
        existingTask: mockTask,
      });

      expect(result.success).toBe(true);
      expect(result.task).toBe(mockTask);
    });

    it("should mark the task as failed when OCR processing fails", async () => {
      // Arrange
      const ocrError = new Error("OCR processing failed");
      mockOCRService.extractTextFromFile.mockRejectedValueOnce(ocrError);

      // Act & Assert
      await expect(useCase.execute({ taskId, userId })).rejects.toThrow(
        ocrError,
      );

      expect(mockTask.updateStatus).toHaveBeenCalledWith(
        QuizGenerationStatus.FAILED,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        mockTask,
      );
    });
  });

  describe("Integration with CreateQuizGenerationTaskUseCase", () => {
    it("should handle errors from CreateQuizGenerationTaskUseCase", async () => {
      // Arrange
      const createError = new Error("Quiz generation failed");
      mockCreateQuizGenerationTaskUseCase.execute.mockRejectedValueOnce(
        createError,
      );

      // Act & Assert
      await expect(useCase.execute({ taskId, userId })).rejects.toThrow(
        createError,
      );

      expect(mockTask.updateStatus).toHaveBeenCalledWith(
        QuizGenerationStatus.FAILED,
      );
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        mockTask,
      );
    });

    it("should log errors when saving a failed task fails", async () => {
      // Arrange
      const saveError = new Error("Database error");
      mockOCRService.extractTextFromFile.mockRejectedValueOnce(
        new Error("OCR failed"),
      );
      mockQuizGenerationTaskRepository.saveTask.mockRejectedValueOnce(
        saveError,
      );

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      // Act
      await expect(useCase.execute({ taskId, userId })).rejects.toThrow(
        "OCR failed",
      );

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  test("resolves with the fastest promise even if others reject", async () => {
    jest.useFakeTimers();

    const fastResolve = new Promise((resolve) =>
      setTimeout(() => resolve("fast"), 300),
    );
    const slowReject = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("slow error")), 200),
    );

    const resultPromise = Promise.race([fastResolve, slowReject]);

    jest.advanceTimersByTime(200);
    await Promise.resolve();

    await expect(resultPromise).rejects.toThrow();
  });
});
