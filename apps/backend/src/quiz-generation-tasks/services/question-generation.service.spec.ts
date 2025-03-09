import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { QuestionGenerationService } from './question-generation.service';
import { OpenAILLMService } from './openai-llm.service';
import { QuizQuestion } from '@flash-me/core/interfaces';
import { faker } from '@faker-js/faker';

describe('QuestionGenerationService', () => {
  let questionGenerationService: QuestionGenerationService;
  let mockOpenAILLMService: Partial<OpenAILLMService>;

  beforeEach(async () => {
    mockOpenAILLMService = {
      generateQuiz: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuestionGenerationService,
        {
          provide: OpenAILLMService,
          useValue: mockOpenAILLMService,
        },
      ],
    }).compile();

    questionGenerationService = moduleRef.get<QuestionGenerationService>(
      QuestionGenerationService,
    );

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuestionsFromText', () => {
    it('should successfully generate and format questions from text', async () => {
      // Arrange
      const text = faker.lorem.paragraphs(5);

      // Create quiz questions with Faker data
      const mockQuizQuestions: QuizQuestion[] = Array.from(
        { length: 3 },
        () => ({
          question: faker.lorem.sentence() + '?',
          answers: [
            { text: faker.lorem.words(3), isCorrect: true },
            { text: faker.lorem.words(3), isCorrect: false },
            { text: faker.lorem.words(3), isCorrect: false },
            { text: faker.lorem.words(3), isCorrect: false },
          ],
        }),
      );

      mockOpenAILLMService.generateQuiz = jest
        .fn()
        .mockResolvedValue(mockQuizQuestions);

      // Act
      const result =
        await questionGenerationService.generateQuestionsFromText(text);

      // Assert
      expect(mockOpenAILLMService.generateQuiz).toHaveBeenCalledWith(text);
      expect(result).toHaveLength(mockQuizQuestions.length);

      // Check that each question was properly formatted
      mockQuizQuestions.forEach((mockQuestion, index) => {
        expect(result[index].question).toBe(mockQuestion.question);
        expect(result[index].answers).toHaveLength(mockQuestion.answers.length);

        // Check that each answer was properly formatted
        mockQuestion.answers.forEach((mockAnswer, answerIndex) => {
          expect(result[index].answers[answerIndex].content).toBe(
            mockAnswer.text,
          );
          expect(result[index].answers[answerIndex].isCorrect).toBe(
            mockAnswer.isCorrect,
          );
        });
      });
    });

    it('should handle errors when generating questions', async () => {
      // Arrange
      const text = faker.lorem.paragraphs(2);
      const errorMessage = `${faker.word.words(3)} error`;
      mockOpenAILLMService.generateQuiz = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        questionGenerationService.generateQuestionsFromText(text),
      ).rejects.toThrow();
      expect(mockOpenAILLMService.generateQuiz).toHaveBeenCalledWith(text);
    });
  });
});
