import { Question } from "../entities/question";

export interface QuestionRepository {
  saveQuestions(questions: Question[]): Promise<void>;
  findById(id: string): Promise<Question | null>;
  findAll(): Promise<Question[]>;
  save(question: Question): Promise<Question>;
}
