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
import { MAX_TEXT_LENGTH } from "../constants/quiz.constants";

describe("CreateQuizGenerationTaskUseCase", () => {
  let createQuizGenerationTaskUseCase: CreateQuizGenerationTaskUseCase;
  let llmService: jest.Mocked<LLMService>;
  let questionRepository: jest.Mocked<QuestionRepository>;
  let answerRepository: jest.Mocked<AnswerRepository>;
  let quizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  const mockUserId = faker.string.uuid();
  const mockUser = { getId: () => mockUserId } as User;

  beforeEach(() => {
    // Use proper mock typing to avoid unbound method warnings
    llmService = {
      generateQuiz: jest
        .fn()
        .mockImplementation(async () => new Promise(() => [])),
    };

    questionRepository = {
      saveQuestions: jest.fn().mockImplementation(async () => {}),
    };

    answerRepository = {
      saveAnswers: jest.fn().mockImplementation(async () => {}),
      findByQuestionId: jest
        .fn()
        .mockImplementation(async () => Promise.resolve([])),
    };

    quizGenerationTaskRepository = {
      saveTask: jest.fn().mockImplementation(async () => {}),
    };

    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      save: jest.fn(),
    };

    createQuizGenerationTaskUseCase = new CreateQuizGenerationTaskUseCase(
      llmService,
      questionRepository,
      answerRepository,
      quizGenerationTaskRepository,
      userRepository,
    );
  });

  it("should generate quiz questions, create a task entity, and save it successfully", async () => {
    // Arrange
    const text = faker.lorem.paragraph(3);
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      },
    ];

    // Use mockResolvedValue instead of spying
    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);
    questionRepository.saveQuestions.mockResolvedValue();
    answerRepository.saveAnswers.mockResolvedValue();

    // Act
    const result = await createQuizGenerationTaskUseCase.execute({
      userId: mockUserId,
      text,
    });

    // Assert
    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
    expect(llmService.generateQuiz).toHaveBeenCalledWith(text);
    expect(questionRepository.saveQuestions).toHaveBeenCalledWith(
      expect.any(Array),
    );
    expect(answerRepository.saveAnswers).toHaveBeenCalledWith(
      expect.any(Array),
    );
    expect(result).toHaveProperty("quizGenerationTask");
    expect(result.quizGenerationTask).toBeInstanceOf(QuizGenerationTask);
    expect(result.quizGenerationTask.getTextContent()).toBe(text);
    expect(result.quizGenerationTask.getStatus()).toBe(
      QuizGenerationStatus.COMPLETED,
    );
    expect(result.quizGenerationTask.getUserId()).toBe(mockUserId);
    expect(result.quizGenerationTask.getQuestions().length).toBe(1);
    expect(result.quizGenerationTask.getQuestions()[0].getContent()).toBe(
      mockLLMQuestions[0].question,
    );
    expect(
      result.quizGenerationTask.getQuestions()[0].getAnswers().length,
    ).toBe(4);
    expect(
      result.quizGenerationTask
        .getQuestions()[0]
        .getAnswers()[0]
        .getIsCorrect(),
    ).toBe(true);

    // Additional assertion
    expect(quizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
      expect.any(QuizGenerationTask),
    );
  });

  it("should throw UserNotFoundError when user does not exist", async () => {
    // Arrange
    const text = faker.lorem.paragraph();
    const nonExistentUserId = faker.string.uuid();

    userRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({
        userId: nonExistentUserId,
        text,
      }),
    ).rejects.toThrow(UserNotFoundError);

    expect(userRepository.findById).toHaveBeenCalledWith(nonExistentUserId);
    expect(llmService.generateQuiz).not.toHaveBeenCalled();
  });

  it("should handle multiple quiz questions from LLM service", async () => {
    // Arrange
    const text = faker.lorem.paragraphs(2);
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      },
      {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      },
    ];

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);

    // Act
    const result = await createQuizGenerationTaskUseCase.execute({
      userId: mockUserId,
      text,
    });

    // Assert
    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
    expect(result.quizGenerationTask.getQuestions().length).toBe(2);
    expect(result.quizGenerationTask.getUserId()).toBe(mockUserId);
    expect(result.quizGenerationTask.getQuestions()[0].getContent()).toBe(
      mockLLMQuestions[0].question,
    );
    expect(result.quizGenerationTask.getQuestions()[1].getContent()).toBe(
      mockLLMQuestions[1].question,
    );
  });

  it("should throw NoQuestionsGeneratedError when LLM returns empty questions array", async () => {
    // Arrange
    const text = faker.lorem.paragraph();
    llmService.generateQuiz.mockResolvedValue([]);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({
        userId: mockUserId,
        text,
      }),
    ).rejects.toThrow(NoQuestionsGeneratedError);

    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
  });

  it("should throw LLMServiceError when LLM service fails", async () => {
    // Arrange
    const text = faker.lorem.paragraph();
    const originalError = new Error("Original LLM error");

    questionRepository.saveQuestions.mockResolvedValue();
    answerRepository.saveAnswers.mockResolvedValue();
    llmService.generateQuiz.mockRejectedValue(originalError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({
        userId: mockUserId,
        text,
      }),
    ).rejects.toThrow(LLMServiceError);

    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
    // Verify that task is saved with failed status
    expect(quizGenerationTaskRepository.saveTask).toHaveBeenCalledWith(
      expect.any(QuizGenerationTask),
    );

    // Get the task from the mock call
    const savedTask = quizGenerationTaskRepository.saveTask.mock.calls[0][0];
    expect(savedTask.getStatus()).toBe(QuizGenerationStatus.FAILED);
  });

  it("should throw QuizStorageError when saving quiz fails", async () => {
    // Arrange
    const text = faker.lorem.paragraph();
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      },
    ];

    const storageError = new Error("Database connection error");

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);
    questionRepository.saveQuestions.mockRejectedValue(storageError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({
        userId: mockUserId,
        text,
      }),
    ).rejects.toThrow(QuizStorageError);

    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
  });

  // Add a test for when question repository fails
  it("should throw QuizStorageError when saving questions fails", async () => {
    // Arrange
    const text = faker.lorem.paragraph();
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      },
    ];

    const storageError = new Error("Question database connection error");

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);
    quizGenerationTaskRepository.saveTask.mockResolvedValue();
    questionRepository.saveQuestions.mockRejectedValue(storageError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({
        userId: mockUserId,
        text,
      }),
    ).rejects.toThrow(QuizStorageError);

    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
  });

  it(`should throw TextTooLongError when text exceeds ${MAX_TEXT_LENGTH} characters`, async () => {
    // Arrange
    // Create text with MAX_TEXT_LENGTH + 1 characters
    const text = "A".repeat(MAX_TEXT_LENGTH + 1);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({
        userId: mockUserId,
        text,
      }),
    ).rejects.toThrow(TextTooLongError);

    // Verify that no other methods were called
    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(llmService.generateQuiz).not.toHaveBeenCalled();
    expect(quizGenerationTaskRepository.saveTask).not.toHaveBeenCalled();
  });

  it(`should accept text exactly at ${MAX_TEXT_LENGTH} characters`, async () => {
    // Arrange
    const text = "A".repeat(MAX_TEXT_LENGTH);
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      },
    ];

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);

    // Act
    const result = await createQuizGenerationTaskUseCase.execute({
      userId: mockUserId,
      text,
    });

    // Assert
    expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
    expect(llmService.generateQuiz).toHaveBeenCalledWith(text);
    expect(result.quizGenerationTask.getTextContent()).toBe(text);
    expect(result.quizGenerationTask.getStatus()).toBe(
      QuizGenerationStatus.COMPLETED,
    );
  });
});
