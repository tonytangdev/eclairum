import { Injectable, Logger } from '@nestjs/common';
import { OpenAILLMService } from './openai-llm.service';
import { QuizQuestion } from '@flash-me/core/interfaces';

export interface QuestionAnswerPair {
  question: string;
  answers: AnswerData[];
}

export interface AnswerData {
  content: string;
  isCorrect: boolean;
}

@Injectable()
export class QuestionGenerationService {
  private readonly logger = new Logger(QuestionGenerationService.name);

  constructor(private readonly openAILLMService: OpenAILLMService) {}

  async generateQuestionsFromText(text: string): Promise<QuestionAnswerPair[]> {
    this.logger.debug(`Generating questions from text using OpenAI`);

    try {
      return await this.fetchAndFormatQuestions(text);
    } catch (error) {
      this.logError('Failed to generate questions with OpenAI', error);
      throw error;
    }
  }

  private async fetchAndFormatQuestions(
    text: string,
  ): Promise<QuestionAnswerPair[]> {
    const generatedQuizQuestions =
      await this.openAILLMService.generateQuiz(text);
    return this.formatQuizQuestions(generatedQuizQuestions);
  }

  private formatQuizQuestions(
    quizQuestions: QuizQuestion[],
  ): QuestionAnswerPair[] {
    return quizQuestions.map((quizQuestion) => ({
      question: quizQuestion.question,
      answers: this.formatAnswers(quizQuestion.answers),
    }));
  }

  private formatAnswers(answers: QuizQuestion['answers']): AnswerData[] {
    return answers.map((answer) => ({
      content: answer.text,
      isCorrect: answer.isCorrect,
    }));
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    } else {
      this.logger.error(`${message}: Unknown error`);
    }
  }
}
