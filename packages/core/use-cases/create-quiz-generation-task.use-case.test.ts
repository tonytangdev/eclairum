import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
  QuizStorageError,
} from "../errors/quiz-errors";

describe("CreateQuizGenerationTaskUseCase", () => {
  let createQuizGenerationTaskUseCase: CreateQuizGenerationTaskUseCase;
  let llmService: jest.Mocked<LLMService>;
  let questionRepository: jest.Mocked<QuestionRepository>;
  let answerRepository: jest.Mocked<AnswerRepository>;
  let quizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;

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

    createQuizGenerationTaskUseCase = new CreateQuizGenerationTaskUseCase(
      llmService,
      questionRepository,
      answerRepository,
      quizGenerationTaskRepository,
    );
  });

  it("should generate quiz questions, create a task entity, and save it successfully", async () => {
    // Arrange
    const text = "This is a sample text for quiz generation";
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: "What is this text about?",
        answers: [
          { text: "Quiz generation", isCorrect: true },
          { text: "Movie reviews", isCorrect: false },
          { text: "Food recipes", isCorrect: false },
          { text: "Sports news", isCorrect: false },
        ],
      },
    ];

    // Use mockResolvedValue instead of spying
    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);
    questionRepository.saveQuestions.mockResolvedValue();
    answerRepository.saveAnswers.mockResolvedValue();

    // Act
    const result = await createQuizGenerationTaskUseCase.execute({ text });

    // Assert
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

  it("should handle multiple quiz questions from LLM service", async () => {
    // Arrange
    const text = "This is a longer text for multiple quiz questions";
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: "Question 1?",
        answers: [
          { text: "Correct answer 1", isCorrect: true },
          { text: "Wrong answer 1", isCorrect: false },
          { text: "Wrong answer 2", isCorrect: false },
          { text: "Wrong answer 3", isCorrect: false },
        ],
      },
      {
        question: "Question 2?",
        answers: [
          { text: "Wrong answer 1", isCorrect: false },
          { text: "Correct answer 2", isCorrect: true },
          { text: "Wrong answer 2", isCorrect: false },
          { text: "Wrong answer 3", isCorrect: false },
        ],
      },
    ];

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);

    // Act
    const result = await createQuizGenerationTaskUseCase.execute({ text });

    // Assert
    expect(result.quizGenerationTask.getQuestions().length).toBe(2);
    expect(result.quizGenerationTask.getQuestions()[0].getContent()).toBe(
      "Question 1?",
    );
    expect(result.quizGenerationTask.getQuestions()[1].getContent()).toBe(
      "Question 2?",
    );
  });

  it("should throw NoQuestionsGeneratedError when LLM returns empty questions array", async () => {
    // Arrange
    const text = "This text doesn't generate any questions";
    llmService.generateQuiz.mockResolvedValue([]);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({ text }),
    ).rejects.toThrow(NoQuestionsGeneratedError);
  });

  it("should throw LLMServiceError when LLM service fails", async () => {
    // Arrange
    const text = "This text causes an LLM service error";
    const originalError = new Error("Original LLM error");

    questionRepository.saveQuestions.mockResolvedValue();
    answerRepository.saveAnswers.mockResolvedValue();
    llmService.generateQuiz.mockRejectedValue(originalError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({ text }),
    ).rejects.toThrow(LLMServiceError);

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
    const text = "This text causes storage error";
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: "What is this text about?",
        answers: [
          { text: "Quiz generation", isCorrect: true },
          { text: "Movie reviews", isCorrect: false },
        ],
      },
    ];

    const storageError = new Error("Database connection error");

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);
    questionRepository.saveQuestions.mockRejectedValue(storageError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({ text }),
    ).rejects.toThrow(QuizStorageError);
  });

  // Add a test for when question repository fails
  it("should throw QuizStorageError when saving questions fails", async () => {
    // Arrange
    const text = "This text causes question storage error";
    const mockLLMQuestions: QuizQuestion[] = [
      {
        question: "What is this text about?",
        answers: [
          { text: "Quiz generation", isCorrect: true },
          { text: "Movie reviews", isCorrect: false },
        ],
      },
    ];

    const storageError = new Error("Question database connection error");

    llmService.generateQuiz.mockResolvedValue(mockLLMQuestions);
    quizGenerationTaskRepository.saveTask.mockResolvedValue();
    questionRepository.saveQuestions.mockRejectedValue(storageError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({ text }),
    ).rejects.toThrow(QuizStorageError);
  });
});
