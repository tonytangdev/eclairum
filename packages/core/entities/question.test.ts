import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { Question } from "./question";
import { Answer } from "./answer";
import { RequiredContentError } from "../errors/validation-errors";

describe("Question", () => {
  // Helper to create a real answer
  const createAnswer = (isCorrect: boolean = false) => {
    return new Answer({
      content: faker.lorem.sentence(),
      isCorrect,
      questionId: randomUUID(),
    });
  };

  // Helper to create valid question params
  const createValidQuestionParams = () => {
    return {
      content: faker.lorem.sentence(),
      answers: [createAnswer(true)],
      quizGenerationTaskId: randomUUID(),
    };
  };

  describe("constructor", () => {
    it("should create a valid question with minimum required properties", () => {
      const content = faker.lorem.sentence();
      const answers = [createAnswer(true)];
      const quizGenerationTaskId = randomUUID();

      const question = new Question({
        content,
        answers,
        quizGenerationTaskId,
      });

      expect(question).toBeInstanceOf(Question);
      expect(question.getContent()).toBe(content);
      expect(question.getAnswers()).toEqual(answers);
      expect(question.getId()).toEqual(expect.any(String));
      expect(question.getCreatedAt()).toEqual(expect.any(Date));
      expect(question.getUpdatedAt()).toEqual(expect.any(Date));
      expect(question.getDeletedAt()).toBe(null);
      expect(question.getQuizGenerationTaskId()).toBe(quizGenerationTaskId);
    });

    it("should create a question with all custom properties", () => {
      const id = randomUUID();
      const content = faker.lorem.sentence();
      const answers = [createAnswer(true), createAnswer(false)];
      const createdAt = new Date(2023, 1, 1);
      const updatedAt = new Date(2023, 1, 2);
      const deletedAt = new Date(2023, 1, 3);
      const quizGenerationTaskId = randomUUID();

      const question = new Question({
        id,
        content,
        answers,
        createdAt,
        updatedAt,
        deletedAt,
        quizGenerationTaskId,
      });

      expect(question.getId()).toBe(id);
      expect(question.getContent()).toBe(content);
      expect(question.getAnswers()).toEqual(answers);
      expect(question.getCreatedAt()).toBe(createdAt);
      expect(question.getUpdatedAt()).toBe(updatedAt);
      expect(question.getDeletedAt()).toBe(deletedAt);
      expect(question.getQuizGenerationTaskId()).toBe(quizGenerationTaskId);
    });

    it("should allow empty answers array", () => {
      const params = createValidQuestionParams();
      params.answers = [];

      const question = new Question(params);

      expect(question.getAnswers()).toEqual([]);
    });

    describe("validation", () => {
      it("should throw RequiredContentError when content is empty string", () => {
        expect(() => {
          new Question({
            content: "",
            answers: [],
            quizGenerationTaskId: randomUUID(),
          });
        }).toThrow(RequiredContentError);
      });

      it("should throw RequiredContentError when content is undefined", () => {
        expect(() => {
          new Question({
            // @ts-expect-error Testing invalid input
            content: undefined,
            answers: [],
            quizGenerationTaskId: randomUUID(),
          });
        }).toThrow(RequiredContentError);
      });

      it("should throw RequiredContentError when content is null", () => {
        expect(() => {
          new Question({
            // @ts-expect-error Testing invalid input
            content: null,
            answers: [],
            quizGenerationTaskId: randomUUID(),
          });
        }).toThrow(RequiredContentError);
      });
    });
  });

  describe("getters", () => {
    it("should return correct values from all getter methods", () => {
      const id = randomUUID();
      const content = faker.lorem.sentence();
      const answers = [createAnswer(true), createAnswer(false)];
      const quizGenerationTaskId = randomUUID();

      const question = new Question({
        id,
        content,
        answers,
        quizGenerationTaskId,
      });

      expect(question.getId()).toBe(id);
      expect(question.getContent()).toBe(content);
      expect(question.getAnswers()).toEqual(answers);
      expect(question.getCreatedAt()).toEqual(expect.any(Date));
      expect(question.getUpdatedAt()).toEqual(expect.any(Date));
      expect(question.getDeletedAt()).toBe(null);
      expect(question.getQuizGenerationTaskId()).toBe(quizGenerationTaskId);
    });

    it("should return quiz generation task id correctly", () => {
      const quizGenerationTaskId = randomUUID();
      const question = new Question({
        ...createValidQuestionParams(),
        quizGenerationTaskId,
      });

      expect(question.getQuizGenerationTaskId()).toBe(quizGenerationTaskId);
    });
  });

  describe("answers handling", () => {
    it("should preserve multiple answers", () => {
      const answers = [
        createAnswer(true),
        createAnswer(false),
        createAnswer(false),
      ];

      const question = new Question({
        content: faker.lorem.sentence(),
        answers,
        quizGenerationTaskId: randomUUID(),
      });

      expect(question.getAnswers().length).toBe(3);
      expect(question.getAnswers()).toEqual(answers);
    });

    it("should add answer correctly using addAnswer method", () => {
      const question = new Question({
        content: faker.lorem.sentence(),
        answers: [],
        quizGenerationTaskId: randomUUID(),
      });

      const newAnswer = createAnswer(true);
      question.addAnswer(newAnswer);

      expect(question.getAnswers()).toContain(newAnswer);
      expect(question.getAnswers().length).toBe(1);
    });

    it("should update the updatedAt timestamp when adding an answer", () => {
      const question = new Question({
        content: faker.lorem.sentence(),
        answers: [],
        quizGenerationTaskId: randomUUID(),
      });

      const originalUpdatedAt = question.getUpdatedAt();

      // Mock Date.now to ensure a different timestamp
      jest.useFakeTimers();
      jest.setSystemTime(new Date(originalUpdatedAt.getTime() + 1000));

      question.addAnswer(createAnswer());

      const newUpdatedAt = question.getUpdatedAt();

      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it("should add multiple answers correctly", () => {
      const question = new Question(createValidQuestionParams());
      const initialAnswersCount = question.getAnswers().length;

      const newAnswer1 = createAnswer(false);
      const newAnswer2 = createAnswer(true);

      question.addAnswer(newAnswer1);
      question.addAnswer(newAnswer2);

      expect(question.getAnswers()).toContain(newAnswer1);
      expect(question.getAnswers()).toContain(newAnswer2);
      expect(question.getAnswers().length).toBe(initialAnswersCount + 2);
    });
  });
});
