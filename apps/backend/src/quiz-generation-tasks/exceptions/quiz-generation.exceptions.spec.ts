import {
  QuizGenerationError,
  OpenAIConnectionError,
  InvalidResponseError,
} from './quiz-generation.exceptions';
import { faker } from '@faker-js/faker';

describe('Quiz Generation Exceptions', () => {
  describe('QuizGenerationError', () => {
    it('should create an instance with message', () => {
      const message = faker.lorem.sentence();
      const error = new QuizGenerationError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QuizGenerationError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('QuizGenerationError');
      expect(error.cause).toBeUndefined();
    });

    it('should create an instance with message and cause', () => {
      const message = faker.lorem.sentence();
      const cause = new Error(faker.lorem.sentence());
      const error = new QuizGenerationError(message, cause);

      expect(error.message).toBe(message);
      expect(error.cause).toBe(cause);
    });
  });

  describe('OpenAIConnectionError', () => {
    it('should create an instance with message', () => {
      const message = faker.lorem.sentence();
      const error = new OpenAIConnectionError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QuizGenerationError);
      expect(error).toBeInstanceOf(OpenAIConnectionError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('OpenAIConnectionError');
      expect(error.cause).toBeUndefined();
    });

    it('should create an instance with message and cause', () => {
      const message = faker.lorem.sentence();
      const cause = new Error(faker.lorem.sentence());
      const error = new OpenAIConnectionError(message, cause);

      expect(error.message).toBe(message);
      expect(error.cause).toBe(cause);
    });
  });

  describe('InvalidResponseError', () => {
    it('should create an instance with message', () => {
      const message = faker.lorem.sentence();
      const error = new InvalidResponseError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(QuizGenerationError);
      expect(error).toBeInstanceOf(InvalidResponseError);
      expect(error.message).toBe(message);
      expect(error.name).toBe('InvalidResponseError');
      expect(error.cause).toBeUndefined();
    });

    it('should create an instance with message and cause', () => {
      const message = faker.lorem.sentence();
      const cause = new Error(faker.lorem.sentence());
      const error = new InvalidResponseError(message, cause);

      expect(error.message).toBe(message);
      expect(error.cause).toBe(cause);
    });
  });

  describe('Error hierarchy', () => {
    it('should maintain proper inheritance', () => {
      const quizError = new QuizGenerationError(faker.lorem.sentence());
      const connectionError = new OpenAIConnectionError(faker.lorem.sentence());
      const formatError = new InvalidResponseError(faker.lorem.sentence());

      expect(quizError instanceof Error).toBe(true);
      expect(connectionError instanceof QuizGenerationError).toBe(true);
      expect(formatError instanceof QuizGenerationError).toBe(true);

      expect(quizError instanceof OpenAIConnectionError).toBe(false);
      expect(quizError instanceof InvalidResponseError).toBe(false);
    });
  });
});
