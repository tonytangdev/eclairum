import { User } from "../entities/user";

export interface UserRepository {
  /**
   * Find a user by their email address
   * @param email The email address to search for
   * @returns The user if found, or null/undefined if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Save a user in the repository
   * @param user The user to save
   * @returns The saved user
   */
  save(user: User): Promise<User>;
}
