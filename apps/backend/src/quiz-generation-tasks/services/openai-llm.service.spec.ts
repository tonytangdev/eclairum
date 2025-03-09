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
      data: generateMockQuestions(),
    };

    it('should successfully generate a quiz', async () => {
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

      // Verify parse was called with correct parameters
      expect(parseMock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              content: expect.any(String),
            }),
            expect.objectContaining({
              role: 'user',
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              content: expect.stringContaining(mockText),
            }),
          ]),
        }),
      );

      // Verify returned data
      expect(result).toEqual(mockQuizData.data);
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
    });

    it('should throw OpenAIConnectionError when OpenAI connection fails', async () => {
      // Setup OpenAI error
      const openaiError = new Error(faker.lorem.sentence());
      openaiError.name = 'APIConnectionError';
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
    });

    it('should throw QuizGenerationError for other errors', async () => {
      // Setup generic error
      parseMock.mockRejectedValue(new Error(faker.lorem.sentence()));

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        QuizGenerationError,
      );
    });

    it('should handle non-Error objects', async () => {
      // Setup string rejection
      parseMock.mockRejectedValue(faker.lorem.sentence());

      await expect(service.generateQuiz(mockText)).rejects.toThrow(
        QuizGenerationError,
      );
    });
  });
});
