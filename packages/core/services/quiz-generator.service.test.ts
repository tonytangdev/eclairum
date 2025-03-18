import { faker } from "@faker-js/faker";
import { QuizGeneratorService } from "./quiz-generator.service";
import {
  GenerateQuizResponse,
  LLMService,
  QuizQuestion,
} from "../interfaces/llm-service.interface";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
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

  /**
   * Helper function to generate mock quiz questions with customizable options
   */
  const createMockQuizResponse = (
    questionCount = 1,
    options?: {
      includeCorrectAnswer?: boolean;
      answersPerQuestion?: number;
      malformedQuestions?: boolean;
    },
  ): GenerateQuizResponse => {
    const defaultOptions = {
      includeCorrectAnswer: true,
      answersPerQuestion: 4,
      malformedQuestions: false,
    };

    const { includeCorrectAnswer, answersPerQuestion, malformedQuestions } = {
      ...defaultOptions,
      ...options,
    };

    return {
      title: faker.lorem.sentence(),
      questions: Array(questionCount)
        .fill(null)
        .map(() => {
          // Create a potentially malformed question if requested
          if (malformedQuestions) {
            return {
              question: faker.lorem.sentence(), // Missing question mark
              answers: [], // Empty answers array
            };
          }

          const answers = Array(answersPerQuestion)
            .fill(null)
            .map((_, index) => ({
              text: faker.lorem.sentence(),
              isCorrect: includeCorrectAnswer ? index === 0 : false,
            }));

          return {
            question: faker.lorem.sentence() + "?",
            answers,
          };
        }),
    };
  };

  beforeEach(() => {
    // Setup mocks
    mockLLMService = {
      generateQuiz: jest.fn(),
    };

    quizGeneratorService = new QuizGeneratorService(mockLLMService);
  });

  describe("generateQuestionsAndTitle", () => {
    it("should successfully generate questions and title from LLM response", async () => {
      // Arrange
      const mockResponse = createMockQuizResponse(3);
      mockLLMService.generateQuiz.mockResolvedValue(mockResponse);

      // Act
      const result = await quizGeneratorService.generateQuestionsAndTitle(
        quizGenerationTaskId,
        sampleText,
      );

      // Assert
      expect(mockLLMService.generateQuiz).toHaveBeenCalledWith(sampleText);

      // Check title
      expect(result.title).toBe(mockResponse.title);

      // Check questions
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0]).toBeInstanceOf(Question);
      expect(result.questions[0].getContent()).toBe(
        mockResponse.questions[0].question,
      );

      // Verify answers
      const answers = result.questions[0].getAnswers();
      expect(answers).toHaveLength(4);
      expect(answers[0]).toBeInstanceOf(Answer);

      // Verify exactly one answer is correct
      const correctAnswers = answers.filter((answer) => answer.getIsCorrect());
      expect(correctAnswers).toHaveLength(1);
    });

    it("should throw NoQuestionsGeneratedError when LLM returns empty questions array", async () => {
      // Arrange
      mockLLMService.generateQuiz.mockResolvedValue({
        title: faker.lorem.sentence(),
        questions: [],
      });

      // Act & Assert
      await expect(
        quizGeneratorService.generateQuestionsAndTitle(
          quizGenerationTaskId,
          sampleText,
        ),
      ).rejects.toThrow(NoQuestionsGeneratedError);
    });

    it("should throw NoQuestionsGeneratedError when LLM returns null questions", async () => {
      // Arrange
      mockLLMService.generateQuiz.mockResolvedValue({
        title: faker.lorem.sentence(),
        questions: null as unknown as QuizQuestion[],
      });

      // Act & Assert
      await expect(
        quizGeneratorService.generateQuestionsAndTitle(
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
        quizGeneratorService.generateQuestionsAndTitle(
          quizGenerationTaskId,
          sampleText,
        ),
      ).rejects.toThrow(LLMServiceError);
    });

    it("should correctly handle questions with varying numbers of answers", async () => {
      // Arrange
      const mockTitle = faker.lorem.sentence();
      const mockQuestion = {
        question: faker.lorem.sentence() + "?",
        answers: [
          { text: faker.lorem.sentence(), isCorrect: true },
          { text: faker.lorem.sentence(), isCorrect: false },
          { text: faker.lorem.sentence(), isCorrect: false },
        ],
      };
      mockLLMService.generateQuiz.mockResolvedValue({
        title: mockTitle,
        questions: [mockQuestion],
      });

      // Act
      const result = await quizGeneratorService.generateQuestionsAndTitle(
        quizGenerationTaskId,
        sampleText,
      );

      // Assert
      expect(result.title).toBe(mockTitle);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].getAnswers()).toHaveLength(3);
    });

    it("should associate questions with the provided task ID", async () => {
      // Arrange
      const mockResponse = createMockQuizResponse(1);
      mockLLMService.generateQuiz.mockResolvedValue(mockResponse);
      const customTaskId = faker.string.uuid();

      // Act
      const result = await quizGeneratorService.generateQuestionsAndTitle(
        customTaskId,
        sampleText,
      );

      // Assert
      expect(result.title).toBe(mockResponse.title);
      expect(result.questions[0].getQuizGenerationTaskId()).toBe(customTaskId);
      result.questions.forEach((question) => {
        expect(question.getQuizGenerationTaskId()).toBe(customTaskId);
      });
    });

    it("should ensure each question has a unique ID", async () => {
      // Arrange
      const mockResponse = createMockQuizResponse(5);
      mockLLMService.generateQuiz.mockResolvedValue(mockResponse);

      // Act
      const result = await quizGeneratorService.generateQuestionsAndTitle(
        quizGenerationTaskId,
        sampleText,
      );

      // Assert
      const questionIds = result.questions.map((question) => question.getId());
      const uniqueIds = new Set(questionIds);
      expect(uniqueIds.size).toBe(questionIds.length);
    });

    it("should correctly associate answers with their respective questions", async () => {
      // Arrange
      const mockResponse = createMockQuizResponse(3);
      mockLLMService.generateQuiz.mockResolvedValue(mockResponse);

      // Act
      const result = await quizGeneratorService.generateQuestionsAndTitle(
        quizGenerationTaskId,
        sampleText,
      );

      // Assert
      result.questions.forEach((question) => {
        const questionId = question.getId();
        const answers = question.getAnswers();

        answers.forEach((answer) => {
          expect(answer.getQuestionId()).toBe(questionId);
        });
      });
    });
  });
});
