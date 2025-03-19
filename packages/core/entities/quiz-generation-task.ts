import { Question } from "./question";
import { RequiredTextContentError } from "../errors/validation-errors";
import { User } from "./user";

export enum QuizGenerationStatus {
  "PENDING" = "PENDING",
  "IN_PROGRESS" = "IN_PROGRESS",
  "COMPLETED" = "COMPLETED",
  "FAILED" = "FAILED",
}

type QuizGenerationTaskConstructor = {
  id?: string;
  textContent: string;
  questions: Question[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  status?: QuizGenerationStatus;
  generatedAt?: Date | null;
  userId: User["id"];
  title?: string | null;
  category?: string | null;
};

export class QuizGenerationTask {
  private id: string;
  private textContent: string;
  private questions: Question[];
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;
  private status: QuizGenerationStatus;
  private generatedAt: Date | null;
  private userId: User["id"];
  private title: string | null;
  private category: string | null;

  constructor({
    id = crypto.randomUUID(),
    textContent,
    questions,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
    status = QuizGenerationStatus.PENDING,
    generatedAt = null,
    userId,
    title = null,
    category = null,
  }: QuizGenerationTaskConstructor) {
    if (!textContent) {
      throw new RequiredTextContentError();
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    this.id = id;
    this.textContent = textContent;
    this.questions = questions;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.status = status;
    this.generatedAt = generatedAt;
    this.userId = userId;
    this.title = title;
    this.category = category;
  }

  public getId(): string {
    return this.id;
  }

  public getTextContent(): string {
    return this.textContent;
  }

  public getQuestions(): Question[] {
    return this.questions;
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

  public getStatus(): QuizGenerationStatus {
    return this.status;
  }

  public getGeneratedAt(): Date | null {
    return this.generatedAt;
  }

  public getUserId(): User["id"] {
    return this.userId;
  }

  public addQuestion(question: Question): void {
    this.questions.push(question);
    this.updatedAt = new Date();
  }

  public updateStatus(status: QuizGenerationStatus): void {
    this.status = status;
    this.updatedAt = new Date();

    if (status === QuizGenerationStatus.COMPLETED && !this.generatedAt) {
      this.generatedAt = new Date();
    }
  }

  public isGenerationComplete(): boolean {
    return this.status === QuizGenerationStatus.COMPLETED;
  }

  public setTitle(title: string): void {
    this.title = title;
  }

  public getTitle(): string | null {
    return this.title;
  }

  public setCategory(category: string): void {
    this.category = category;
  }

  public getCategory(): string | null {
    return this.category;
  }
}
