import { CreateQuizGenerationTaskUseCase } from "./create-quiz-generation-task.use-case";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { QuizService } from "../interfaces/quiz-service.interface";
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
  let quizService: jest.Mocked<QuizService>;

  beforeEach(() => {
    // Use proper mock typing to avoid unbound method warnings
    llmService = {
      generateQuiz: jest
        .fn()
        .mockImplementation(async () => new Promise(() => [])),
    };

    quizService = {
      saveQuizGenerationTask: jest.fn().mockImplementation(async () => {}),
      saveQuestions: jest.fn().mockImplementation(async () => {}),
    };

    createQuizGenerationTaskUseCase = new CreateQuizGenerationTaskUseCase(
      llmService,
      quizService,
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
    quizService.saveQuizGenerationTask.mockResolvedValue();

    // Act
    const result = await createQuizGenerationTaskUseCase.execute({ text });

    // Assert
    expect(llmService.generateQuiz).toHaveBeenCalledWith(text);
    expect(quizService.saveQuizGenerationTask).toHaveBeenCalledWith(
      expect.any(QuizGenerationTask),
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

    quizService.saveQuizGenerationTask.mockResolvedValue();
    llmService.generateQuiz.mockRejectedValue(originalError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({ text }),
    ).rejects.toThrow(LLMServiceError);

    // Verify that task is saved with failed status
    expect(quizService.saveQuizGenerationTask).toHaveBeenCalledWith(
      expect.any(QuizGenerationTask),
    );

    // Get the task from the mock call
    const savedTask = quizService.saveQuizGenerationTask.mock.calls[0][0];
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
    quizService.saveQuizGenerationTask.mockRejectedValue(storageError);

    // Act & Assert
    await expect(
      createQuizGenerationTaskUseCase.execute({ text }),
    ).rejects.toThrow(QuizStorageError);
  });
});
