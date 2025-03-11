import { UserAnswer } from "../entities/user_answer";

export interface UserAnswersRepository {
  /**
   * Find a specific user answer by its ID
   * @param id The ID of the user answer
   * @returns The UserAnswer if found, or null if not found
   */
  findById(id: UserAnswer["id"]): Promise<UserAnswer | null>;

  /**
   * Save a user answer in the repository
   * @param userAnswer The user answer to save
   * @returns The saved user answer
   */
  save(userAnswer: UserAnswer): Promise<UserAnswer>;
}
