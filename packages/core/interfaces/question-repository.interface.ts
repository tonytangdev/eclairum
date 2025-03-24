import { User } from "../entities";
import { Question } from "../entities/question";
import { QuizGenerationTask } from "../entities/quiz-generation-task";

export interface QuestionRepository {
  saveQuestions(questions: Question[]): Promise<void>;
  findById(id: string): Promise<Question | null>;
  findByUserId(userId: User["id"]): Promise<Question[]>;
  findByQuizGenerationTaskId(
    taskId: QuizGenerationTask["id"],
  ): Promise<Question[]>;
  save(question: Question): Promise<Question>;

  /**
   * Soft deletes all questions associated with a specific quiz generation task
   * @param taskId The ID of the quiz generation task
   * @param transaction Optional transaction object for atomic operations
   */
  softDeleteByTaskId(
    taskId: QuizGenerationTask["id"],
    transaction?: unknown,
  ): Promise<void>;
}
