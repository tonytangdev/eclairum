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

  it("should create a valid quiz generation task with minimum required properties", () => {
    const textContent = faker.lorem.paragraph();
    const questions = [];

    const task = new QuizGenerationTask({
      textContent,
      questions,
    });

    expect(task).toBeInstanceOf(QuizGenerationTask);
    expect(task.getTextContent()).toBe(textContent);
    expect(task.getQuestions()).toEqual(questions);
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

    const task = new QuizGenerationTask({
      id,
      textContent,
      questions,
      createdAt,
      updatedAt,
      deletedAt,
      status,
      generatedAt,
    });

    expect(task.getId()).toBe(id);
    expect(task.getTextContent()).toBe(textContent);
    expect(task.getQuestions()).toEqual(questions);
    expect(task.getCreatedAt()).toBe(createdAt);
    expect(task.getUpdatedAt()).toBe(updatedAt);
    expect(task.getDeletedAt()).toBe(deletedAt);
    expect(task.getStatus()).toBe(status);
    expect(task.getGeneratedAt()).toBe(generatedAt);
  });

  it("should throw RequiredTextContentError when text content is empty", () => {
    expect(() => {
      new QuizGenerationTask({
        textContent: "",
        questions: [createQuestion()],
      });
    }).toThrow(RequiredTextContentError);
    expect(() => {
      new QuizGenerationTask({
        textContent: "",
        questions: [createQuestion()],
      });
    }).toThrow("Text content is required");
  });

  it("should update status and set generated date when completed", () => {
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraph(),
      questions: [createQuestion()],
    });

    expect(task.getStatus()).toBe(QuizGenerationStatus.PENDING);
    expect(task.getGeneratedAt()).toBe(null);

    task.updateStatus(QuizGenerationStatus.IN_PROGRESS);
    expect(task.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
    expect(task.getGeneratedAt()).toBe(null);

    task.updateStatus(QuizGenerationStatus.COMPLETED);
    expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
    expect(task.getGeneratedAt()).toBeInstanceOf(Date);
    expect(task.isGenerationComplete()).toBe(true);
  });

  it("should add a question to the task", () => {
    const task = new QuizGenerationTask({
      textContent: faker.lorem.paragraph(),
      questions: [createQuestion()],
    });

    const initialCount = task.getQuestions().length;
    const newQuestion = createQuestion();

    task.addQuestion(newQuestion);

    expect(task.getQuestions().length).toBe(initialCount + 1);
    expect(task.getQuestions()).toContain(newQuestion);
  });
});
