import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { QuizService } from "../interfaces/quiz-service.interface";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
  QuizStorageError,
} from "../errors/quiz-errors";

type CreateQuizGenerationTaskUseCaseRequest = {
  text: string;
};

type CreateQuizGenerationTaskUseCaseResponse = {
  quizGenerationTask: QuizGenerationTask;
};

export class CreateQuizGenerationTaskUseCase {
  constructor(
    private readonly llmService: LLMService,
    private readonly quizService: QuizService,
  ) {}

  async execute({
    text,
  }: CreateQuizGenerationTaskUseCaseRequest): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    // Create a new quiz generation task
    const quizGenerationTask = new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
    });

    try {
      // Generate quiz questions using LLM service
      let llmQuestions: QuizQuestion[];
      try {
        llmQuestions = await this.llmService.generateQuiz(text);
      } catch (error) {
        throw new LLMServiceError(
          `Failed to generate quiz questions: ${(error as Error).message}`,
          error as Error,
        );
      }

      // Check if we have any questions
      if (!llmQuestions || llmQuestions.length === 0) {
        throw new NoQuestionsGeneratedError(text);
      }

      // Convert LLM questions to domain entities
      const questions = llmQuestions.map((llmQuestion) => {
        const question = new Question({
          content: llmQuestion.question,
          answers: [],
        });

        // Create answer entities for each answer
        const answers = llmQuestion.answers.map((llmAnswer) => {
          return new Answer({
            content: llmAnswer.text,
            isCorrect: llmAnswer.isCorrect,
            questionId: question.getId(),
          });
        });

        // Add answers to the question
        answers.forEach((answer) => {
          question.addAnswer(answer);
        });
        return question;
      });

      // Add questions to the task
      questions.forEach((question) => {
        quizGenerationTask.addQuestion(question);
      });

      // Mark the task as completed
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);

      // Save the quiz generation task using quiz service
      try {
        await this.quizService.saveQuizGenerationTask(quizGenerationTask);
      } catch (error) {
        throw new QuizStorageError(
          `Failed to save quiz generation task: ${(error as Error).message}`,
          error as Error,
        );
      }

      return {
        quizGenerationTask,
      };
    } catch (error) {
      // If there's an error, mark the task as failed
      quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);

      // Still try to save the task with the failed status
      try {
        await this.quizService.saveQuizGenerationTask(quizGenerationTask);
      } catch (saveError) {
        console.error("Failed to save failed quiz generation task:", saveError);
      }

      // Re-throw the error
      throw error;
    }
  }
}
