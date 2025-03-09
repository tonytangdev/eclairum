import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMService, QuizQuestion } from '@flash-me/core/interfaces';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// Define the Zod schema for our quiz questions
const QuizSchema = z.object({
  data: z
    .array(
      z.object({
        question: z.string(),
        answers: z
          .array(
            z.object({
              text: z.string().min(1),
              isCorrect: z.boolean(),
            }),
          )
          .length(4),
      }),
    )
    .length(10),
});

@Injectable()
export class OpenAILLMService implements LLMService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateQuiz(text: string): Promise<QuizQuestion[]> {
    try {
      // Use the parse method with zodResponseFormat
      const completion = await this.openai.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized quiz generation assistant. Create concise, accurate quiz questions based on provided text.',
          },
          {
            role: 'user',
            content: `Generate 10 quiz questions based on this text: "${text}"`,
          },
        ],
        temperature: 0.5,
        response_format: zodResponseFormat(QuizSchema, 'quiz'),
      });

      // The response is already parsed and validated
      const quiz = completion.choices[0].message.parsed;

      if (!quiz) {
        throw new Error();
      }

      return quiz.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error(
        `Failed to generate quiz: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
