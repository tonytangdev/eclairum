import { Answer } from "../entities";
import { Question } from "../entities/question";

export interface AnswerRepository {
  saveAnswers(answers: Answer[]): Promise<void>;
  findByQuestionId(questionId: string): Promise<Answer[]>;
  findById(id: string): Promise<Answer | null>;

  /**
   * Soft deletes all answers associated with a specific question
   * @param questionId The ID of the question
   */
  softDeleteByQuestionId(questionId: Question["id"]): Promise<void>;

  /**
   * Saves an answer
   * @param answer The answer to save
   */
  save(answer: Answer): Promise<void>;
}
