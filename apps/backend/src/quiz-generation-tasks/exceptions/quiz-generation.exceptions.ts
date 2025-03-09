export class QuizGenerationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'QuizGenerationError';
  }
}

export class OpenAIConnectionError extends QuizGenerationError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'OpenAIConnectionError';
  }
}

export class InvalidResponseError extends QuizGenerationError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'InvalidResponseError';
  }
}
