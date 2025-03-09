import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "./quiz-generation-task";
import { Question } from "./question";
import { Answer } from "./answer";
import { RequiredTextContentError } from "../errors/validation-errors";

describe("QuizGenerationTask", () => {
  // Helper to create answers
  const createAnswer = (isCorrect: boolean = false) => {
    return new Answer({
      content: faker.lorem.sentence(),
      isCorrect,
      questionId: randomUUID(),
    });
  };

  // Helper to create questions
  const createQuestion = () => {
    return new Question({
      content: faker.lorem.sentence(),
      answers: [createAnswer(true), createAnswer(false)],
    });
  };

  // Mock userId for tests
  const mockUserId = faker.internet.email();

  it("should create a valid quiz generation task with minimum required properties", () => {
    const textContent = faker.lorem.paragraph();
    const questions = [];

    const task = new QuizGenerationTask({
      textContent,
      questions,
      userId: mockUserId,
    });

    expect(task).toBeInstanceOf(QuizGenerationTask);
    expect(task.getTextContent()).toBe(textContent);
    expect(task.getQuestions()).toEqual(questions);
    expect(task.getUserId()).toBe(mockUserId);
    expect(task.getId()).toEqual(expect.any(String));
    expect(task.getCreatedAt()).toEqual(expect.any(Date));
    expect(task.getUpdatedAt()).toEqual(expect.any(Date));
    expect(task.getDeletedAt()).toBe(null);
    expect(task.getStatus()).toBe(QuizGenerationStatus.PENDING);
    expect(task.getGeneratedAt()).toBe(null);
  });

  it("should create a task with all custom properties", () => {
    const id = randomUUID();
    const textContent = faker.lorem.paragraph();
    const questions = [createQuestion(), createQuestion()];
    const createdAt = new Date(2023, 1, 1);
    const updatedAt = new Date(2023, 1, 2);
    const deletedAt = new Date(2023, 1, 3);
    const status = QuizGenerationStatus.COMPLETED;
    const generatedAt = new Date(2023, 1, 4);
    const userId = faker.internet.email();

    const task = new QuizGenerationTask({
      id,
      textContent,
      questions,
      createdAt,
      updatedAt,
      deletedAt,
      status,
      generatedAt,
      userId,
    });

    expect(task.getId()).toBe(id);
    expect(task.getTextContent()).toBe(textContent);
    expect(task.getQuestions()).toEqual(questions);
    expect(task.getCreatedAt()).toBe(createdAt);
    expect(task.getUpdatedAt()).toBe(updatedAt);
    expect(task.getDeletedAt()).toBe(deletedAt);
    expect(task.getStatus()).toBe(status);
    expect(task.getGeneratedAt()).toBe(generatedAt);
    expect(task.getUserId()).toBe(userId);
  });

  it("should throw RequiredTextContentError when text content is empty", () => {
    expect(() => {
      new QuizGenerationTask({
        textContent: "",
        questions: [createQuestion()],
        userId: mockUserId,
      });
    }).toThrow(RequiredTextContentError);
    expect(() => {
      new QuizGenerationTask({
        textContent: "",
        questions: [createQuestion()],
        userId: mockUserId,
      });
    }).toThrow("Text content is required");
  });

  it("should throw an error when userId is not provided", () => {
    expect(() => {
      new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [],
        userId: "", // Empty userId
      });
    }).toThrow("User ID is required");
  });

  it("should update status and set generated date when completed", () => {
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraph(),
      questions: [createQuestion()],
      userId: mockUserId,
    });

    expect(task.getStatus()).toBe(QuizGenerationStatus.PENDING);
    expect(task.getGeneratedAt()).toBe(null);

    task.updateStatus(QuizGenerationStatus.IN_PROGRESS);
    expect(task.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
    expect(task.getGeneratedAt()).toBe(null);

    const beforeCompleted = new Date();
    task.updateStatus(QuizGenerationStatus.COMPLETED);
    const afterCompleted = new Date();

    expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
    expect(task.getGeneratedAt()).toBeInstanceOf(Date);
    expect(task.isGenerationComplete()).toBe(true);

    // Verify the timestamp is between before and after
    const generatedAt = task.getGeneratedAt() as Date;
    expect(generatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeCompleted.getTime(),
    );
    expect(generatedAt.getTime()).toBeLessThanOrEqual(afterCompleted.getTime());
  });

  it("should add a question to the task", () => {
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraph(),
      questions: [createQuestion()],
      userId: mockUserId,
    });

    const initialCount = task.getQuestions().length;
    const initialUpdateTime = task.getUpdatedAt();

    // Wait a short time to ensure updated timestamp changes
    setTimeout(() => {
      const newQuestion = createQuestion();
      task.addQuestion(newQuestion);

      expect(task.getQuestions().length).toBe(initialCount + 1);
      expect(task.getQuestions()).toContain(newQuestion);
      expect(task.getUpdatedAt().getTime()).toBeGreaterThan(
        initialUpdateTime.getTime(),
      );
    }, 10);
  });

  it("should return correct user ID", () => {
    const userId = faker.internet.email();
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraph(),
      questions: [],
      userId,
    });

    expect(task.getUserId()).toBe(userId);
  });

  it("should mark task as FAILED", () => {
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraph(),
      questions: [],
      userId: mockUserId,
    });

    task.updateStatus(QuizGenerationStatus.FAILED);

    expect(task.getStatus()).toBe(QuizGenerationStatus.FAILED);
    expect(task.isGenerationComplete()).toBe(false);
  });
});
