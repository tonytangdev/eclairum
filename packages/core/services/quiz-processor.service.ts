import { QuizProcessor } from "../interfaces/quiz-processor.interface";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { QuizStorageService } from "./quiz-storage.service";
import { QuizGenerator } from "../interfaces/quiz-generator.interface";

/**
 * Default implementation of QuizProcessor interface
 * This service handles the processing of quiz generation tasks
 */
export class DefaultQuizProcessor implements QuizProcessor {
  constructor(
    private readonly quizGenerator: QuizGenerator,
    private readonly quizStorage: QuizStorageService,
  ) {}

  /**
   * Process a quiz generation task
   * @param quizGenerationTask The task to process
   * @param text The text content to generate the quiz from
   */
  async processQuizGeneration(
    quizGenerationTask: QuizGenerationTask,
    text: string,
  ): Promise<void> {
    try {
      const { questions, title } =
        await this.quizGenerator.generateQuestionsAndTitle(
          quizGenerationTask.getId(),
          text,
        );

      this.setTitleForTask(quizGenerationTask, title);
      this.addQuestionsToTask(quizGenerationTask, questions);
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);
      await this.quizStorage.saveQuizData(quizGenerationTask, questions);
    } catch (error) {
      await this.handleFailedTask(quizGenerationTask, error);
    }
  }

  private setTitleForTask(
    quizGenerationTask: QuizGenerationTask,
    title: string,
  ): void {
    quizGenerationTask.setTitle(title);
  }

  private addQuestionsToTask(
    task: QuizGenerationTask,
    questions: Question[],
  ): void {
    questions.forEach((question) => task.addQuestion(question));
  }

  private async handleFailedTask(
    quizGenerationTask: QuizGenerationTask,
    error: unknown,
  ): Promise<void> {
    quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);

    try {
      await this.quizStorage.saveFailedTask(quizGenerationTask);
    } catch (saveError) {
      console.error("Failed to save failed quiz generation task:", saveError);
    }

    throw error;
  }
}
