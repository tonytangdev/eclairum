import { UserAnswer } from "../entities/user-answer";
import { User } from "../entities/user";

export interface UserAnswersRepository {
  findById(id: UserAnswer["id"]): Promise<UserAnswer | null>;
  save(userAnswer: UserAnswer): Promise<UserAnswer>;
  findAnsweredQuestionIds(userId: User["id"]): Promise<string[]>;
  findQuestionAnswerFrequencies(
    userId: User["id"],
  ): Promise<Map<string, number>>;
}
