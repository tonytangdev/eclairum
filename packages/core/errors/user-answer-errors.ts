export class InvalidAnswerError extends Error {
  constructor(message: string = "The provided answer is invalid") {
    super(message);
    this.name = "InvalidAnswerError";
  }
}
