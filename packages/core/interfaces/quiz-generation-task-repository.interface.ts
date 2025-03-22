import { User } from "../entities";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import {
  PaginationParams,
  PaginatedResult,
} from "../shared/pagination.interface";

export interface QuizGenerationTaskRepository {
  saveTask(task: QuizGenerationTask): Promise<void>;
  findById(id: string): Promise<QuizGenerationTask | null>;
  findByUserId(userId: User["id"]): Promise<QuizGenerationTask[]>;
  findByUserIdPaginated(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<QuizGenerationTask>>;

  /**
   * Soft deletes a quiz generation task by ID
   * @param id The task ID
   */
  softDelete(id: QuizGenerationTask["id"]): Promise<void>;
}
