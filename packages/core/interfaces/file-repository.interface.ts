import { File } from "../entities/file";
import { QuizGenerationTask } from "../entities/quiz-generation-task";

/**
 * Interface for File repository operations
 */
export interface FileRepository {
  /**
   * Find a file by its ID
   * @param id The ID of the file to find
   * @returns Promise resolving to the file or null if not found
   */
  findById(id: File["id"]): Promise<File | null>;

  /**
   * Find a file by the quiz generation task ID
   * @param quizGenerationTaskId The ID of the associated quiz generation task
   * @returns Promise resolving to the file or null if not found
   */
  findByQuizGenerationTaskId(
    quizGenerationTaskId: QuizGenerationTask["id"],
  ): Promise<File | null>;

  /**
   * Save a file entity
   * @param file The file entity to save
   * @returns Promise resolving to the saved file
   */
  save(file: File): Promise<File>;

  /**
   * Soft delete a file by setting its deletedAt field
   * @param id The ID of the file to delete
   * @returns Promise resolving to void
   */
  softDelete(id: File["id"]): Promise<void>;
}
