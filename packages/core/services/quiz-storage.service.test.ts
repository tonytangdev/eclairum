import { faker } from "@faker-js/faker";
import { QuizStorageService } from "./quiz-storage.service";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
import { QuizStorageError } from "../errors/quiz-errors";

describe("QuizStorageService", () => {
  let quizStorageService: QuizStorageService;
  let mockQuestionRepository: jest.Mocked<QuestionRepository>;
  let mockAnswerRepository: jest.Mocked<AnswerRepository>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;

  // Helper function to create a quiz generation task with questions and answers
  const createMockQuizGenerationTask = (): QuizGenerationTask => {
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraphs(2),
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
      userId: faker.string.uuid(),
    });

    const questionCount = 2;
    for (let i = 0; i < questionCount; i++) {
      const question = new Question({
        content: faker.lorem.sentence() + "?",
        answers: [],
        quizGenerationTaskId: task.getId(),
      });

      // Add 4 answers to each question (1 correct, 3 incorrect)
      for (let j = 0; j < 4; j++) {
        const answer = new Answer({
          content: faker.lorem.sentence(),
          isCorrect: j === 0, // First answer is correct
          questionId: question.getId(),
        });
        question.addAnswer(answer);
      }

      task.addQuestion(question);
    }

    return task;
  };

  beforeEach(() => {
    // Setup mocks
    mockQuestionRepository = {
      saveQuestions: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockAnswerRepository = {
      saveAnswers: jest.fn(),
      findByQuestionId: jest.fn(),
      findById: jest.fn(),
    };

    mockQuizGenerationTaskRepository = {
      saveTask: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByUserIdPaginated: jest.fn(),
    };

    quizStorageService = new QuizStorageService(
      mockQuestionRepository,
      mockAnswerRepository,
      mockQuizGenerationTaskRepository,
    );
  });

  describe("saveTask", () => {
    it("should save a quiz generation task", async () => {
      // Arrange
      const task = createMockQuizGenerationTask();

      // Act
      await quizStorageService.saveTask(task);

      // Assert
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        task,
      );
    });
  });

  describe("saveQuizData", () => {
    it("should save a quiz task with its questions and answers", async () => {
      // Arrange
      const task = createMockQuizGenerationTask();
      const questions = task.getQuestions();

      // Act
      await quizStorageService.saveQuizData(task, questions);

      // Assert
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        task,
      );
      expect(mockQuestionRepository.saveQuestions).toHaveBeenCalledWith(
        questions,
      );

      // Calculate total number of answers across all questions
      const allAnswers = questions.flatMap((q) => q.getAnswers());
      expect(mockAnswerRepository.saveAnswers).toHaveBeenCalledWith(allAnswers);
    });

    it("should throw QuizStorageError when task repository fails", async () => {
      // Arrange
      const task = createMockQuizGenerationTask();
      const questions = task.getQuestions();
      const dbError = new Error("Database connection error");
      mockQuizGenerationTaskRepository.saveTask.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        quizStorageService.saveQuizData(task, questions),
      ).rejects.toThrow(QuizStorageError);
    });

    it("should throw QuizStorageError when question repository fails", async () => {
      // Arrange
      const task = createMockQuizGenerationTask();
      const questions = task.getQuestions();
      const dbError = new Error("Failed to save questions");
      mockQuestionRepository.saveQuestions.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        quizStorageService.saveQuizData(task, questions),
      ).rejects.toThrow(QuizStorageError);
    });

    it("should throw QuizStorageError when answer repository fails", async () => {
      // Arrange
      const task = createMockQuizGenerationTask();
      const questions = task.getQuestions();
      const dbError = new Error("Failed to save answers");
      mockAnswerRepository.saveAnswers.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        quizStorageService.saveQuizData(task, questions),
      ).rejects.toThrow(QuizStorageError);
    });
  });

  describe("saveFailedTask", () => {
    it("should save a failed task without questions", async () => {
      // Arrange
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraphs(1),
        questions: [],
        status: QuizGenerationStatus.FAILED,
        userId: faker.string.uuid(),
      });

      // Act
      await quizStorageService.saveFailedTask(task);

      // Assert
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        task,
      );
      expect(mockQuestionRepository.saveQuestions).not.toHaveBeenCalled();
    });

    it("should save a failed task with partial questions", async () => {
      // Arrange
      const task = createMockQuizGenerationTask();
      task.updateStatus(QuizGenerationStatus.FAILED);
      const questions = task.getQuestions();

      // Act
      await quizStorageService.saveFailedTask(task);

      // Assert
      expect(mockQuizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
        task,
      );
      expect(mockQuestionRepository.saveQuestions).toHaveBeenCalledWith(
        questions,
      );
    });
  });
});
