type AnswerConstructor = {
  id?: string;
  content: string;
  isCorrect: boolean;
};

export class Answer {
  private id: string;
  private content: string;
  private isCorrect: boolean;

  constructor({
    id = crypto.randomUUID(),
    content,
    isCorrect,
  }: AnswerConstructor) {
    if (!content) {
      throw new Error("Content is required");
    }

    this.id = id;
    this.content = content;
    this.isCorrect = isCorrect;
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
}
