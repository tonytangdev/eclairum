import {
  GenerateQuizResponse,
  LLMService,
  QuizQuestion,
} from "../interfaces/llm-service.interface";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
} from "../errors/quiz-errors";

export class QuizGeneratorService {
  constructor(private readonly llmService: LLMService) {}

  async generateQuestionsAndTitle(
    quizGenerationTaskId: QuizGenerationTask["id"],
    text: string,
  ): Promise<{ title: string; questions: Question[] }> {
    const { questions: llmQuestions, title } =
      await this.fetchQuestionsFromLLM(text);
    this.validateLLMResponse(llmQuestions, text);
    const questions = this.convertLLMQuestionsToEntities(
      quizGenerationTaskId,
      llmQuestions,
    );

    return { questions, title };
  }

  private async fetchQuestionsFromLLM(
    text: string,
  ): Promise<GenerateQuizResponse> {
    try {
      return await this.llmService.generateQuiz(text);
    } catch (error) {
      throw new LLMServiceError(
        `Failed to generate quiz questions: ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  private validateLLMResponse(questions: QuizQuestion[], text: string): void {
    if (!questions || questions.length === 0) {
      throw new NoQuestionsGeneratedError(text);
    }
  }

  private convertLLMQuestionsToEntities(
    quizGenerationTaskId: QuizGenerationTask["id"],
    llmQuestions: QuizQuestion[],
  ): Question[] {
    return llmQuestions.map((llmQuestion) => {
      const question = new Question({
        content: llmQuestion.question,
        answers: [],
        quizGenerationTaskId,
      });

      this.addAnswersToQuestion(question, llmQuestion);
      return question;
    });
  }

  private addAnswersToQuestion(
    question: Question,
    llmQuestion: QuizQuestion,
  ): void {
    const answers = llmQuestion.answers.map((llmAnswer) => {
      return new Answer({
        content: llmAnswer.text,
        isCorrect: llmAnswer.isCorrect,
        questionId: question.getId(),
      });
    });

    answers.forEach((answer) => question.addAnswer(answer));
  }
}
