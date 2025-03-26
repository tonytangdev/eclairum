import { Question } from "./question";
import { User } from "./user";
import { File } from "./file";

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
  file?: File | null;
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
  private file: File | null;

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
    file = null,
  }: QuizGenerationTaskConstructor) {
    // Removed validation for non-empty textContent to support file uploads

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
    this.file = file;
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

  public getFile(): File | null {
    return this.file;
  }

  public setFile(file: File): void {
    this.file = file;
    this.updatedAt = new Date();
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

  public hasFile(): boolean {
    return this.file !== null;
  }
}
