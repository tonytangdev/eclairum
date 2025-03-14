import { UserAnswer } from "../entities/user_answer";
import { User } from "../entities/user";

export interface UserAnswersRepository {
  findById(id: UserAnswer["id"]): Promise<UserAnswer | null>;
  save(userAnswer: UserAnswer): Promise<UserAnswer>;
  findByUserId(userId: User["id"]): Promise<UserAnswer[]>;
}
