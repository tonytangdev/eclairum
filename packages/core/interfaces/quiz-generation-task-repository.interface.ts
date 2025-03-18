import { User } from "../entities";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
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
}
