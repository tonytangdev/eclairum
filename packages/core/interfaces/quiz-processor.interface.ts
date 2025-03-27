import { QuizGenerationTask } from "../entities/quiz-generation-task";

/**
 * Interface for processing quiz generation tasks
 * This allows for better testability by enabling dependency injection and mocking
 */
export interface QuizProcessor {
  /**
   * Process a quiz generation task
   * @param quizGenerationTask The task to process
   * @param text The text content to generate the quiz from
   */
  processQuizGeneration(
    quizGenerationTask: QuizGenerationTask,
    text: string,
  ): Promise<void>;
}
