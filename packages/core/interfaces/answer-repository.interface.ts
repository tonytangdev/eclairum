import { Answer } from "../entities/answer";

export interface AnswerRepository {
  saveAnswers(answers: Answer[]): Promise<void>;
}
