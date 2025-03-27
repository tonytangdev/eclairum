import { faker } from "@faker-js/faker";
import { DefaultQuizProcessor } from "./quiz-processor.service";
import { QuizGeneratorService } from "./quiz-generator.service";
import { QuizStorageService } from "./quiz-storage.service";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";

// Mock dependencies
jest.mock("./quiz-generator.service");
jest.mock("./quiz-storage.service");

describe("DefaultQuizProcessor", () => {
  // Setup mocks with proper typing
  const mockQuizGenerator: jest.Mocked<QuizGeneratorService> = {
    generateQuestionsAndTitle: jest.fn(),
  } as unknown as jest.Mocked<QuizGeneratorService>;

  const mockQuizStorage: jest.Mocked<QuizStorageService> = {
    saveQuizData: jest.fn(),
    saveFailedTask: jest.fn(),
  } as unknown as jest.Mocked<QuizStorageService>;

  // Create test subject
  let quizProcessor: DefaultQuizProcessor;

  // Test data generator functions
  const createMockTask = (): QuizGenerationTask => {
    return new QuizGenerationTask({
      id: faker.string.uuid(),
      textContent: faker.lorem.paragraph(),
      status: QuizGenerationStatus.IN_PROGRESS,
      userId: faker.string.uuid(),
      questions: [],
    });
  };

  const createMockQuestions = (count: number, taskId: string): Question[] => {
    return Array.from({ length: count }, () => {
      const questionId = faker.string.uuid();
      const answers = Array.from(
        { length: 4 },
        () =>
          new Answer({
            id: faker.string.uuid(),
            content: faker.lorem.sentence(),
            isCorrect: faker.datatype.boolean(),
            questionId,
          }),
      );

      return new Question({
        id: questionId,
        content: faker.lorem.sentence(), // Fixed: changed from 'text' to 'content' to match the Question entity
        answers,
        quizGenerationTaskId: taskId,
      });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    quizProcessor = new DefaultQuizProcessor(
      mockQuizGenerator,
      mockQuizStorage,
    );
  });

  describe("processQuizGeneration", () => {
    it("should successfully process a quiz generation task", async () => {
      // Arrange
      const task = createMockTask();
      const text = faker.lorem.paragraph();
      const taskId = task.getId();
      const questions = createMockQuestions(5, taskId);
      const title = faker.lorem.sentence();

      // Setup mock responses
      mockQuizGenerator.generateQuestionsAndTitle.mockResolvedValue({
        questions,
        title,
      });

      // Act
      await quizProcessor.processQuizGeneration(task, text);

      // Assert
      expect(mockQuizGenerator.generateQuestionsAndTitle).toHaveBeenCalledWith(
        taskId,
        text,
      );
      expect(task.getTitle()).toBe(title);
      expect(task.getQuestions()).toHaveLength(questions.length);
      expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
      expect(mockQuizStorage.saveQuizData).toHaveBeenCalledWith(
        task,
        questions,
      );
    });

    it("should handle failures during quiz generation", async () => {
      // Arrange
      const task = createMockTask();
      const text = faker.lorem.paragraph();
      const error = new Error("Quiz generation failed");
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      mockQuizGenerator.generateQuestionsAndTitle.mockRejectedValue(error);

      // Act & Assert
      await expect(
        quizProcessor.processQuizGeneration(task, text),
      ).rejects.toThrow(error);

      // Verify error handling behavior
      expect(task.getStatus()).toBe(QuizGenerationStatus.FAILED);
      expect(mockQuizStorage.saveFailedTask).toHaveBeenCalledWith(task);

      consoleSpy.mockRestore();
    });

    it("should throw the original error even if saving failed task fails", async () => {
      // Arrange
      const task = createMockTask();
      const text = faker.lorem.paragraph();
      const generationError = new Error("Quiz generation failed");
      const saveError = new Error("Failed to save task");

      mockQuizGenerator.generateQuestionsAndTitle.mockRejectedValue(
        generationError,
      );
      mockQuizStorage.saveFailedTask.mockRejectedValue(saveError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // Act & Assert
      await expect(
        quizProcessor.processQuizGeneration(task, text),
      ).rejects.toThrow(generationError); // Should throw the original error

      expect(task.getStatus()).toBe(QuizGenerationStatus.FAILED);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save failed quiz generation task:",
        saveError,
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty question list from generator", async () => {
      // Arrange
      const task = createMockTask();
      const text = faker.lorem.paragraph();
      const title = faker.lorem.sentence();

      mockQuizGenerator.generateQuestionsAndTitle.mockResolvedValue({
        questions: [],
        title,
      });

      // Act
      await quizProcessor.processQuizGeneration(task, text);

      // Assert
      expect(task.getTitle()).toBe(title);
      expect(task.getQuestions()).toHaveLength(0);
      expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
      expect(mockQuizStorage.saveQuizData).toHaveBeenCalledWith(task, []);
    });

    it("should handle empty title from generator", async () => {
      // Arrange
      const task = createMockTask();
      const text = faker.lorem.paragraph();
      const questions = createMockQuestions(3, task.getId());

      mockQuizGenerator.generateQuestionsAndTitle.mockResolvedValue({
        questions,
        title: "",
      });

      // Act
      await quizProcessor.processQuizGeneration(task, text);

      // Assert
      expect(task.getTitle()).toBe("");
      expect(task.getQuestions()).toHaveLength(questions.length);
      expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
    });

    it("should correctly handle tasks with existing questions", async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const existingQuestions = createMockQuestions(2, taskId);
      const task = new QuizGenerationTask({
        id: taskId,
        textContent: faker.lorem.paragraph(),
        status: QuizGenerationStatus.IN_PROGRESS,
        userId: faker.string.uuid(),
        questions: [...existingQuestions],
      });

      const text = faker.lorem.paragraph();
      const newQuestions = createMockQuestions(3, taskId);
      const title = faker.lorem.sentence();

      // This is important to verify the initial state
      expect(task.getQuestions()).toHaveLength(existingQuestions.length);

      mockQuizGenerator.generateQuestionsAndTitle.mockResolvedValue({
        questions: newQuestions,
        title,
      });

      // Act
      await quizProcessor.processQuizGeneration(task, text);

      // Assert
      expect(task.getTitle()).toBe(title);

      // Get the actual questions after processing
      const finalQuestions = task.getQuestions();

      // It appears the QuizGenerationTask implementation is adding new questions
      // to the existing collection, not replacing them
      expect(finalQuestions.length).toBe(
        existingQuestions.length + newQuestions.length,
      );
      expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);

      // Verify with storage service
      expect(mockQuizStorage.saveQuizData).toHaveBeenCalledWith(
        task,
        newQuestions,
      );
    });
  });
});
