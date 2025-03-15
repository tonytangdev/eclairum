import { User } from "../entities";
import { Question } from "../entities/question";

export interface QuestionRepository {
  saveQuestions(questions: Question[]): Promise<void>;
  findById(id: string): Promise<Question | null>;
  findByUserId(userId: User["id"]): Promise<Question[]>;
  save(question: Question): Promise<Question>;
}
