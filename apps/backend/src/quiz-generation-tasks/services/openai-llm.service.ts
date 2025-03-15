import { Injectable, Logger, Inject } from '@nestjs/common';
import { LLMService, QuizQuestion } from '@flash-me/core/interfaces';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import {
  QuizGenerationError,
  OpenAIConnectionError,
  InvalidResponseError,
} from '../exceptions/quiz-generation.exceptions';
import { OPENAI_CLIENT } from '../providers/openai.provider';

export const LLM_SERVICE_PROVIDER_KEY = 'LLMService';

// Define the Zod schema for our quiz questions
const QuizSchema = z.object({
  data: z.array(
    z.object({
      question: z.string(),
      answers: z.array(
        z.object({
          text: z.string(),
          isCorrect: z.boolean(),
        }),
      ),
    }),
  ),
});

@Injectable()
export class OpenAILLMService implements LLMService {
  private readonly logger = new Logger(OpenAILLMService.name);

  constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

  async generateQuiz(text: string): Promise<QuizQuestion[]> {
    try {
      this.logger.log(`Generating quiz from text of length: ${text.length}`);

      // 1 question per 200 characters
      // maximum 50 questions
      const count = Math.min(Math.ceil(text.length / 200), 50);

      // Use the parse method with zodResponseFormat
      const completion = await this.openai.beta.chat.completions.parse({
        model: 'o3-mini',
        messages: [
          {
            role: 'system',
            content: `You are a specialized quiz generation assistant. Create concise, accurate quiz questions based on provided text. You must provide ${count} questions and for each 4 answers.`,
          },
          {
            role: 'user',
            content: `Generate ${count} quiz questions based on this text: "${text}"`,
          },
        ],
        // temperature: 0.5,
        response_format: zodResponseFormat(QuizSchema, 'quiz'),
      });

      // The response is already parsed and validated
      const quiz = completion.choices[0].message.parsed;

      if (!quiz) {
        throw new InvalidResponseError('No quiz data received from OpenAI');
      }

      this.logger.debug('Successfully generated quiz questions');
      return quiz.data;
    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof InvalidResponseError) {
          throw error;
        }

        if (
          error.name === 'OpenAIError' ||
          error.name === 'APIConnectionError'
        ) {
          this.logger.error(
            `OpenAI connection error: ${error.message}`,
            error.stack,
          );
          throw new OpenAIConnectionError(
            'Failed to connect to OpenAI service',
            error,
          );
        }

        if (error.name === 'ZodError') {
          this.logger.error(
            `Response validation failed: ${error.message}`,
            error.stack,
          );
          throw new InvalidResponseError(
            'Generated quiz does not match expected format',
            error,
          );
        }

        this.logger.error(
          `Unexpected error during quiz generation: ${error.message}`,
          error.stack,
        );
        throw new QuizGenerationError(
          `Failed to generate quiz: ${error.message}`,
          error,
        );
      }
    }

    throw new QuizGenerationError('Failed to generate quiz');
  }
}
