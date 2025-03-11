export class InvalidAnswerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswerError";
  }
}

export class UserAnswerStorageError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "UserAnswerStorageError";
  }
}
