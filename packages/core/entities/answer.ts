import { Question } from "./question";
import { RequiredContentError } from "../errors/validation-errors";

type AnswerConstructor = {
  id?: string;
  content: string;
  isCorrect: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  questionId: Question["id"];
};

export class Answer {
  private id: string;
  private content: string;
  private isCorrect: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;
  private questionId: Question["id"];

  constructor({
    id = crypto.randomUUID(),
    content,
    isCorrect,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
    questionId,
  }: AnswerConstructor) {
    if (!content) {
      throw new RequiredContentError("Answer");
    }

    this.id = id;
    this.content = content;
    this.isCorrect = isCorrect;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.questionId = questionId;
  }

  public getId(): string {
    return this.id;
  }

  public getContent(): string {
    return this.content;
  }

  public getIsCorrect(): boolean {
    return this.isCorrect;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public getQuestionId(): Question["id"] {
    return this.questionId;
  }
}
