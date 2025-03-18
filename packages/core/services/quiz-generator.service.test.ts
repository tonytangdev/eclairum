import { faker } from "@faker-js/faker";
import { QuizGeneratorService } from "./quiz-generator.service";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { Question } from "../entities/question";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
} from "../errors/quiz-errors";

describe("QuizGeneratorService", () => {
  let quizGeneratorService: QuizGeneratorService;
  let mockLLMService: jest.Mocked<LLMService>;

  // Test data
  const quizGenerationTaskId = faker.string.uuid();
  const sampleText = faker.lorem.paragraphs(2);

  // Helper function to generate mock quiz questions
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
    // Setup mocks
    mockLLMService = {
      generateQuiz: jest.fn(),
    };

    quizGeneratorService = new QuizGeneratorService(mockLLMService);
  });

  describe("generateQuestions", () => {
    it("should successfully generate questions from LLM response", async () => {
      // Arrange
      const mockQuestions = createMockQuizQuestions(3);
      mockLLMService.generateQuiz.mockResolvedValue(mockQuestions);

      // Act
      const result = await quizGeneratorService.generateQuestions(
        quizGenerationTaskId,
        sampleText,
      );

      // Assert
      expect(mockLLMService.generateQuiz).toHaveBeenCalledWith(sampleText);
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(Question);
      expect(result[0].getContent()).toBe(mockQuestions[0].question);

      // Verify answers
      const answers = result[0].getAnswers();
      expect(answers).toHaveLength(4);

      // Verify at least one answer is correct
      const correctAnswers = answers.filter((answer) => answer.getIsCorrect());
      expect(correctAnswers).toHaveLength(1);
    });

    it("should throw NoQuestionsGeneratedError when LLM returns empty array", async () => {
      // Arrange
      mockLLMService.generateQuiz.mockResolvedValue([]);

      // Act & Assert
      await expect(
        quizGeneratorService.generateQuestions(
          quizGenerationTaskId,
          sampleText,
        ),
      ).rejects.toThrow(NoQuestionsGeneratedError);
    });

    it("should throw NoQuestionsGeneratedError when LLM returns null", async () => {
      // Arrange
      mockLLMService.generateQuiz.mockResolvedValue(
        null as unknown as QuizQuestion[],
      );

      // Act & Assert
      await expect(
        quizGeneratorService.generateQuestions(
          quizGenerationTaskId,
          sampleText,
        ),
      ).rejects.toThrow(NoQuestionsGeneratedError);
    });

    it("should throw LLMServiceError when LLM service fails", async () => {
      // Arrange
      const llmError = new Error("LLM service unavailable");
      mockLLMService.generateQuiz.mockRejectedValue(llmError);

      // Act & Assert
      await expect(
        quizGeneratorService.generateQuestions(
          quizGenerationTaskId,
          sampleText,
        ),
      ).rejects.toThrow(LLMServiceError);
    });

    it("should correctly handle questions with varying numbers of answers", async () => {
      // Arrange
      const mockQuestion = {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      };
      mockLLMService.generateQuiz.mockResolvedValue([mockQuestion]);

      // Act
      const result = await quizGeneratorService.generateQuestions(
        quizGenerationTaskId,
        sampleText,
      );

      // Assert
      expect(result[0].getAnswers()).toHaveLength(3);
    });

    it("should associate questions with the provided task ID", async () => {
      // Arrange
      const mockQuestions = createMockQuizQuestions(1);
      mockLLMService.generateQuiz.mockResolvedValue(mockQuestions);
      const customTaskId = faker.string.uuid();

      // Act
      const result = await quizGeneratorService.generateQuestions(
        customTaskId,
        sampleText,
      );

      // Assert
      expect(result[0].getQuizGenerationTaskId()).toBe(customTaskId);
    });
  });
});
