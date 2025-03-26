import { QuizGenerationTask } from "./quiz-generation-task";

type FileConstructor = {
  id?: string;
  path: string;
  bucketName: string;
  quizGenerationTaskId: QuizGenerationTask["id"];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class File {
  private id: string;
  private path: string;
  private bucketName: string;
  private quizGenerationTaskId: QuizGenerationTask["id"];
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor({
    id = crypto.randomUUID(),
    path,
    bucketName,
    quizGenerationTaskId,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
  }: FileConstructor) {
    if (!path) {
      throw new Error("File path is required");
    }

    if (!bucketName) {
      throw new Error("Bucket name is required");
    }

    if (!quizGenerationTaskId) {
      throw new Error("Quiz generation task ID is required");
    }

    this.id = id;
    this.path = path;
    this.bucketName = bucketName;
    this.quizGenerationTaskId = quizGenerationTaskId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getPath(): string {
    return this.path;
  }

  public getBucketName(): string {
    return this.bucketName;
  }

  public getQuizGenerationTaskId(): QuizGenerationTask["id"] {
    return this.quizGenerationTaskId;
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

  public setPath(path: string): void {
    this.path = path;
    this.updatedAt = new Date();
  }

  public delete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  public restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
