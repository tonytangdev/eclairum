import { Answer } from "./answer";
import { RequiredContentError } from "../errors/validation-errors";
import { QuizGenerationTask } from "./quiz-generation-task";

type QuestionConstructor = {
  id?: string;
  content: string;
  answers: Answer[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  quizGenerationTaskId: QuizGenerationTask["id"];
};

export class Question {
  private id: string;
  private content: string;
  private answers: Answer[];
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;
  private quizGenerationTaskId: QuizGenerationTask["id"];

  constructor({
    id = crypto.randomUUID(),
    content,
    answers,
    quizGenerationTaskId,
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
    this.quizGenerationTaskId = quizGenerationTaskId;
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

  public getQuizGenerationTaskId(): QuizGenerationTask["id"] {
    return this.quizGenerationTaskId;
  }

  public setContent(content: string): void {
    if (!content) {
      throw new RequiredContentError("Question");
    }
    this.content = content;
    this.updatedAt = new Date();
  }

  /**
   * Sets the answers array and updates the updatedAt timestamp
   */
  private setAnswers(answers: Answer[]): void {
    this.answers = answers;
  }

  /**
   * Shuffles the order of answers using Fisher-Yates algorithm
   * This is useful for randomizing answer placement in quizzes
   */
  public shuffleAnswers(): void {
    const answers = [...this.answers];

    // Perform Fisher-Yates shuffle
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    this.setAnswers(answers);
  }
}
