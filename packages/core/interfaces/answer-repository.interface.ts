import { Answer } from "../entities";

export interface AnswerRepository {
  saveAnswers(answers: Answer[]): Promise<void>;
  findByQuestionId(questionId: string): Promise<Answer[]>;
  findById(id: string): Promise<Answer | null>;
}
