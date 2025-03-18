import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { OpenAILLMService } from './openai-llm.service';
import {
  QuizGenerationError,
  OpenAIConnectionError,
  InvalidResponseError,
} from '../exceptions/quiz-generation.exceptions';
import { faker } from '@faker-js/faker';
import { OPENAI_CLIENT } from '../providers/openai.provider';
import { GenerateQuizResponse } from '@eclairum/core/interfaces';

// Mock OpenAI
const mockOpenAI = {
  beta: {
    chat: {
      completions: {
        parse: jest.fn(),
      },
    },
  },
};

describe('OpenAILLMService', () => {
  let service: OpenAILLMService;
  let parseMock: jest.Mock;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(faker.string.alphanumeric(24)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup the parse mock
    parseMock = mockOpenAI.beta.chat.completions.parse;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAILLMService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OPENAI_CLIENT, useValue: mockOpenAI },
      ],
    }).compile();

    // Override logger to avoid console outputs during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    service = module.get<OpenAILLMService>(OpenAILLMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQuiz', () => {
    const mockText = faker.lorem.paragraphs(3);
    const mockTitle = faker.lorem.sentence();

    const generateMockQuestions = () =>
      Array(10)
        .fill(null)
        .map(() => ({
          question: faker.lorem.sentence() + '?',
          answers: Array(4)
            .fill(null)
            .map((_, i) => ({
              text: faker.lorem.sentence(),
              isCorrect: i === 0, // First answer is correct
            })),
        }));

    const mockQuizData = {
      title: mockTitle,
      data: generateMockQuestions(),
    };

    const expectedResponse: GenerateQuizResponse = {
      title: mockTitle,
      questions: mockQuizData.data,
    };

    it('should successfully generate a quiz with correct structure', async () => {
      // Setup successful response
      parseMock.mockResolvedValue({
        choices: [
          {
            message: {
              parsed: mockQuizData,
            },
          },
        ],
      });

      const result = await service.generateQuiz(mockText);

      // Verify returned data structure
      expect(result).toHaveProperty('title', mockTitle);
      expect(result).toHaveProperty('questions');
      expect(Array.isArray(result.questions)).toBe(true);
      expect(result.questions).toHaveLength(mockQuizData.data.length);

      // Check first question structure
      const firstQuestion = result.questions[0];
      expect(firstQuestion).toHaveProperty('question');
      expect(firstQuestion).toHaveProperty('answers');
      expect(Array.isArray(firstQuestion.answers)).toBe(true);

      // Check answer structure
      const firstAnswer = firstQuestion.answers[0];
      expect(firstAnswer).toHaveProperty('text');
      expect(firstAnswer).toHaveProperty('isCorrect');
    });

    it('should return the expected quiz data when generation succeeds', async () => {
      // Setup successful response
      parseMock.mockResolvedValue({
        choices: [
          {
            message: {
              parsed: mockQuizData,
            },
          },
        ],
      });

      const result = await service.generateQuiz(mockText);

      // Verify the service properly transforms the OpenAI response
      expect(result).toEqual(expectedResponse);
    });

    it('should generate quizzes for texts of different lengths', async () => {
      // Setup successful responses
      parseMock.mockResolvedValue({
        choices: [
          {
            message: {
              parsed: mockQuizData,
            },
          },
        ],
      });

      const shortText = faker.lorem.paragraph();
      const longText = faker.lorem.paragraphs(50);

      // Both should generate valid quizzes regardless of length
      const shortResult = await service.generateQuiz(shortText);
      const longResult = await service.generateQuiz(longText);

      // Verify both calls succeeded and returned properly structured data
      expect(shortResult).toEqual(expectedResponse);
      expect(longResult).toEqual(expectedResponse);
    });

    it('should throw InvalidResponseError when quiz is null', async () => {
      // Setup null response
      parseMock.mockResolvedValue({
        choices: [
          {
            message: {
              parsed: null,
            },
          },
        ],
      });

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        InvalidResponseError,
      );
      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        'No quiz data received from OpenAI',
      );
    });

    it('should throw OpenAIConnectionError when OpenAI connection fails', async () => {
      // Setup OpenAI error
      const openaiError = new Error(faker.lorem.sentence());
      openaiError.name = 'APIConnectionError';
      parseMock.mockRejectedValue(openaiError);

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        OpenAIConnectionError,
      );
      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        'Failed to connect to OpenAI service',
      );
    });

    it('should throw OpenAIConnectionError for OpenAIError', async () => {
      // Setup OpenAI service error
      const openaiError = new Error(faker.lorem.sentence());
      openaiError.name = 'OpenAIError';
      parseMock.mockRejectedValue(openaiError);

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        OpenAIConnectionError,
      );
    });

    it('should throw InvalidResponseError when response format is invalid', async () => {
      // Setup Zod error
      const zodError = new Error(faker.lorem.sentence());
      zodError.name = 'ZodError';
      parseMock.mockRejectedValue(zodError);

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        InvalidResponseError,
      );
      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        'Generated quiz does not match expected format',
      );
    });

    it('should throw QuizGenerationError for other errors', async () => {
      // Setup generic error
      const genericError = new Error(faker.lorem.sentence());
      parseMock.mockRejectedValue(genericError);

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        QuizGenerationError,
      );
      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        `Failed to generate quiz: ${genericError.message}`,
      );
    });

    it('should handle non-Error objects', async () => {
      // Setup string rejection
      const nonErrorValue = faker.lorem.sentence();
      parseMock.mockRejectedValue(nonErrorValue);

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        QuizGenerationError,
      );
      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        'Failed to generate quiz',
      );
    });
  });
});
