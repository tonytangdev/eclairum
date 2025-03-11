import { faker } from "@faker-js/faker";
import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
  QuizStorageError,
  UserNotFoundError,
  TextTooLongError,
} from "../errors/quiz-errors";
import { User } from "../entities/user";
import { MAX_TEXT_LENGTH } from "../constants/quiz";

describe("CreateQuizGenerationTaskUseCase", () => {
  let useCase: CreateQuizGenerationTaskUseCase;
  let llmService: jest.Mocked<LLMService>;
  let questionRepository: jest.Mocked<QuestionRepository>;
  let answerRepository: jest.Mocked<AnswerRepository>;
  let quizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  // Common test data
  const userId = faker.string.uuid();
  const mockUser = { getId: () => userId } as User;
  const defaultText = faker.lorem.paragraph(3);

  // Helper to create mock quiz questions
  const createMockQuizQuestions = (count = 1): QuizQuestion[] => {
    return Array(count)
      .fill(null)
      .map(() => ({
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      }));
  };

  beforeEach(() => {
    // Setup mocks with better type definitions
    llmService = {
      generateQuiz: jest.fn().mockResolvedValue([]),
    };

    questionRepository = {
      saveQuestions: jest.fn().mockResolvedValue(undefined),
    };

    answerRepository = {
      saveAnswers: jest.fn().mockResolvedValue(undefined),
      findByQuestionId: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
    };

    quizGenerationTaskRepository = {
      saveTask: jest.fn().mockResolvedValue(undefined),
    };

    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new CreateQuizGenerationTaskUseCase(
      llmService,
      questionRepository,
      answerRepository,
      quizGenerationTaskRepository,
      userRepository,
    );
  });

  describe("Successful quiz generation", () => {
    it("should generate a quiz with a single question successfully", async () => {
      // Arrange
      const mockQuestions = createMockQuizQuestions(1);
      llmService.generateQuiz.mockResolvedValue(mockQuestions);

      // Act
      const result = await useCase.execute({ userId, text: defaultText });

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(llmService.generateQuiz).toHaveBeenCalledWith(defaultText);
      expect(questionRepository.saveQuestions).toHaveBeenCalledTimes(1);
      expect(answerRepository.saveAnswers).toHaveBeenCalledTimes(1);
      expect(quizGenerationTaskRepository.saveTask).toHaveBeenCalledTimes(1);

      // Verify quiz generation task details
      expect(result.quizGenerationTask).toBeInstanceOf(QuizGenerationTask);
      expect(result.quizGenerationTask.getTextContent()).toBe(defaultText);
      expect(result.quizGenerationTask.getStatus()).toBe(
        QuizGenerationStatus.COMPLETED,
      );
      expect(result.quizGenerationTask.getUserId()).toBe(userId);

      // Verify question details
      const questions = result.quizGenerationTask.getQuestions();
      expect(questions.length).toBe(1);
      expect(questions[0].getContent()).toBe(mockQuestions[0].question);

      // Verify answer details
      const answers = questions[0].getAnswers();
      expect(answers.length).toBe(4);
      expect(answers.filter((a) => a.getIsCorrect()).length).toBe(1);
      expect(answers[0].getIsCorrect()).toBe(true);
    });

    it("should handle multiple quiz questions correctly", async () => {
      // Arrange
      const questionCount = 3;
      const mockQuestions = createMockQuizQuestions(questionCount);
      llmService.generateQuiz.mockResolvedValue(mockQuestions);

      // Act
      const result = await useCase.execute({ userId, text: defaultText });

      // Assert
      const questions = result.quizGenerationTask.getQuestions();
      expect(questions.length).toBe(questionCount);

      // Verify each question matches the expected data
      for (let i = 0; i < questionCount; i++) {
        expect(questions[i].getContent()).toBe(mockQuestions[i].question);
        expect(questions[i].getAnswers().length).toBe(4);
        expect(questions[i].getAnswers()[0].getIsCorrect()).toBe(true);
      }
    });

    it(`should accept text exactly at ${MAX_TEXT_LENGTH} characters limit`, async () => {
      // Arrange
      const exactLengthText = "A".repeat(MAX_TEXT_LENGTH);
      const mockQuestions = createMockQuizQuestions(1);
      llmService.generateQuiz.mockResolvedValue(mockQuestions);

      // Act
      const result = await useCase.execute({ userId, text: exactLengthText });

      // Assert
      expect(llmService.generateQuiz).toHaveBeenCalledWith(exactLengthText);
      expect(result.quizGenerationTask.getTextContent()).toBe(exactLengthText);
      expect(result.quizGenerationTask.getStatus()).toBe(
        QuizGenerationStatus.COMPLETED,
      );
    });
  });

  describe("Input validation", () => {
    it("should throw UserNotFoundError when user does not exist", async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(UserNotFoundError);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(llmService.generateQuiz).not.toHaveBeenCalled();
    });

    it(`should throw TextTooLongError when text exceeds ${MAX_TEXT_LENGTH} characters`, async () => {
      // Arrange
      const tooLongText = "A".repeat(MAX_TEXT_LENGTH + 1);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: tooLongText }),
      ).rejects.toThrow(TextTooLongError);

      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(llmService.generateQuiz).not.toHaveBeenCalled();
    });

    it("should throw NoQuestionsGeneratedError when LLM returns empty questions array", async () => {
      // Arrange
      llmService.generateQuiz.mockResolvedValue([]);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(NoQuestionsGeneratedError);
    });
  });

  describe("Error handling", () => {
    it("should throw LLMServiceError and save task with FAILED status when LLM service fails", async () => {
      // Arrange
      const llmError = new Error("LLM service unavailable");
      llmService.generateQuiz.mockRejectedValue(llmError);

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(LLMServiceError);

      // Verify task is saved with failed status
      expect(quizGenerationTaskRepository.saveTask).toHaveBeenCalledTimes(1);
      const savedTask = quizGenerationTaskRepository.saveTask.mock.calls[0][0];
      expect(savedTask.getStatus()).toBe(QuizGenerationStatus.FAILED);
      expect(savedTask.getUserId()).toBe(userId);
      expect(savedTask.getTextContent()).toBe(defaultText);
    });

    it("should throw QuizStorageError when saving questions fails", async () => {
      // Arrange
      const mockQuestions = createMockQuizQuestions(1);
      llmService.generateQuiz.mockResolvedValue(mockQuestions);
      questionRepository.saveQuestions.mockRejectedValue(
        new Error("Database error"),
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(QuizStorageError);
    });

    it("should throw QuizStorageError when saving answers fails", async () => {
      // Arrange
      const mockQuestions = createMockQuizQuestions(1);
      llmService.generateQuiz.mockResolvedValue(mockQuestions);
      questionRepository.saveQuestions.mockResolvedValue(undefined);
      answerRepository.saveAnswers.mockRejectedValue(
        new Error("Database error"),
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(QuizStorageError);
    });

    it("should throw QuizStorageError when saving quiz generation task fails", async () => {
      // Arrange
      const mockQuestions = createMockQuizQuestions(1);
      llmService.generateQuiz.mockResolvedValue(mockQuestions);
      quizGenerationTaskRepository.saveTask.mockRejectedValue(
        new Error("Database error"),
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId, text: defaultText }),
      ).rejects.toThrow(QuizStorageError);
    });
  });
});
