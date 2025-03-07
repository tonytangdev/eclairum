import { User } from "../entities/user";

export interface UserService {
  createUser(user: User): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
}
