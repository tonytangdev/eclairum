import { User } from "../entities";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
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
   * Find quiz generation tasks with specific statuses for a user
   * @param userId The user ID
   * @param statuses Array of quiz generation statuses to filter by
   * @returns Promise resolving to an array of matching quiz generation tasks
   */
  findByUserIdAndStatuses(
    userId: string,
    statuses: QuizGenerationStatus[],
  ): Promise<QuizGenerationTask[]>;

  /**
   * Soft deletes a quiz generation task by ID
   * @param id The task ID
   */
  softDelete(id: QuizGenerationTask["id"]): Promise<void>;
}
