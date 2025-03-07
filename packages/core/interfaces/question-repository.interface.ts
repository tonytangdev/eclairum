import { Question } from "../entities/question";

export interface QuestionRepository {
  saveQuestions(questions: Question[]): Promise<void>;
}
