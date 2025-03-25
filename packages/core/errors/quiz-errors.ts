export class LLMServiceError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "LLMServiceError";
  }
}

export class NoQuestionsGeneratedError extends Error {
  constructor(text: string) {
    super(
      `No questions were generated from the provided text: "${text.substring(0, 50)}..."`,
    );
    this.name = "NoQuestionsGeneratedError";
  }
}

export class QuizStorageError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "QuizStorageError";
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class TextTooLongError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextTooLongError";
  }
}

export class TaskNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskNotFoundError";
  }
}

export class UnauthorizedTaskAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedTaskAccessError";
  }
}

export class InvalidQuestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidQuestionError";
    Object.setPrototypeOf(this, InvalidQuestionError.prototype);
  }
}

export class OCRProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OCRProcessingError";
  }
}
