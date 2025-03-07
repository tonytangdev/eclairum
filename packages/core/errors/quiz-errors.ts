export class LLMServiceError extends Error {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "LLMServiceError";

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class NoQuestionsGeneratedError extends Error {
  constructor(text: string) {
    super(
      `No questions could be generated from the provided text: ${text.substring(0, 50)}`,
    );
    this.name = "NoQuestionsGeneratedError";
  }
}

export class QuizStorageError extends Error {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = "QuizStorageError";

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}
