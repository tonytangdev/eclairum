import { Answer } from "../entities";
import { EntityManager } from "typeorm";

export interface AnswerRepository {
  saveAnswers(answers: Answer[], entityManager?: EntityManager): Promise<void>;
  findByQuestionId(questionId: string): Promise<Answer[]>;
}
