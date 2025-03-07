import { Answer } from "./answer";
import { RequiredContentError } from "../errors/validation-errors";

type QuestionConstructor = {
  id?: string;
  content: string;
  answers: Answer[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class Question {
  private id: string;
  private content: string;
  private answers: Answer[];
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor({
    id = crypto.randomUUID(),
    content,
    answers = [],
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
  }: QuestionConstructor) {
    if (!content) {
      throw new RequiredContentError("Question");
    }

    this.id = id;
    this.content = content;
    this.answers = answers;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getContent(): string {
    return this.content;
  }

  public getAnswers(): Answer[] {
    return this.answers;
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

  public addAnswer(answer: Answer): void {
    this.answers.push(answer);
    this.updatedAt = new Date();
  }
}
