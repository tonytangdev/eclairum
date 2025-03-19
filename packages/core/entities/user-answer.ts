import { User } from "./user";
import { Question } from "./question";
import { Answer } from "./answer";
import { InvalidAnswerError } from "../errors/user-answer-errors";

type UserAnswerConstructor = {
  id?: string;
  userId: User["id"];
  questionId: Question["id"];
  answer: Answer;
  createdAt?: Date;
  updatedAt?: Date;
};

export class UserAnswer {
  private id: string;
  private userId: User["id"];
  private questionId: Question["id"];
  private answer: Answer;
  private createdAt: Date;
  private updatedAt: Date;

  constructor({
    id = crypto.randomUUID(),
    userId,
    questionId,
    answer,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: UserAnswerConstructor) {
    if (!userId) {
      throw new InvalidAnswerError("User ID is required");
    }

    if (!questionId) {
      throw new InvalidAnswerError("Question ID is required");
    }

    if (!answer) {
      throw new InvalidAnswerError("Answer is required");
    }

    this.id = id;
    this.userId = userId;
    this.questionId = questionId;
    this.answer = answer;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getUserId(): User["id"] {
    return this.userId;
  }

  public getQuestionId(): Question["id"] {
    return this.questionId;
  }

  public getAnswer(): Answer {
    return this.answer;
  }

  public getAnswerId(): Answer["id"] {
    return this.answer.getId();
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public isCorrect(): boolean {
    return this.answer.getIsCorrect();
  }
}
