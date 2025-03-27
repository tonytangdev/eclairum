import { Question } from "../entities/question";
import { QuizGenerationTask } from "../entities/quiz-generation-task";

/**
 * Interface for services that generate quiz questions and titles
 * based on provided text content.
 */
export interface QuizGenerator {
  /**
   * Generates a set of questions and a title for a quiz based on the provided text.
   *
   * @param quizGenerationTaskId - The unique identifier of the quiz generation task
   * @param text - The text content to generate questions from
   * @returns A promise resolving to an object containing the quiz title and questions
   */
  generateQuestionsAndTitle(
    quizGenerationTaskId: QuizGenerationTask["id"],
    text: string,
  ): Promise<{ title: string; questions: Question[] }>;
}
