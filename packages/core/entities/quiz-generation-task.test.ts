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
  const createAnswer = (isCorrect: boolean = false): Answer => {
    return new Answer({
      content: faker.lorem.sentence(),
      isCorrect,
      questionId: randomUUID(),
    });
  };

  // Helper to create questions
  const createQuestion = (): Question => {
    return new Question({
      content: faker.lorem.sentence(),
      answers: [createAnswer(true), createAnswer(false)],
      quizGenerationTaskId: randomUUID(),
    });
  };

  // Mock userId for tests
  const mockUserId = faker.internet.email();

  describe("Construction", () => {
    it("should create a valid quiz generation task with minimum required properties", () => {
      // Given minimal required properties
      const textContent = faker.lorem.paragraph();
      const questions: Question[] = [];

      // When creating a task
      const task = new QuizGenerationTask({
        textContent,
        questions,
        userId: mockUserId,
      });

      // Then the task should be properly initialized
      expect(task).toBeInstanceOf(QuizGenerationTask);
      expect(task.getTextContent()).toBe(textContent);
      expect(task.getQuestions()).toEqual(questions);
      expect(task.getUserId()).toBe(mockUserId);
      expect(task.getId()).toEqual(expect.any(String) as string);
      expect(task.getCreatedAt()).toEqual(expect.any(Date) as Date);
      expect(task.getUpdatedAt()).toEqual(expect.any(Date) as Date);
      expect(task.getDeletedAt()).toBe(null);
      expect(task.getStatus()).toBe(QuizGenerationStatus.PENDING);
      expect(task.getGeneratedAt()).toBe(null);
    });

    it("should create a task with all custom properties", () => {
      // Given all custom properties
      const id = randomUUID();
      const textContent = faker.lorem.paragraph();
      const questions = [createQuestion(), createQuestion()];
      const createdAt = new Date(2023, 1, 1);
      const updatedAt = new Date(2023, 1, 2);
      const deletedAt = new Date(2023, 1, 3);
      const status = QuizGenerationStatus.COMPLETED;
      const generatedAt = new Date(2023, 1, 4);
      const userId = faker.internet.email();

      // When creating a task with all properties
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

      // Then all properties should be set correctly
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
      // When creating a task with empty text content
      // Then it should throw the appropriate error
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
      // When creating a task with empty userId
      // Then it should throw the appropriate error
      expect(() => {
        new QuizGenerationTask({
          textContent: faker.lorem.paragraph(),
          questions: [],
          userId: "", // Empty userId
        });
      }).toThrow("User ID is required");
    });
  });

  describe("Status management", () => {
    it("should update status and set generated date when completed", () => {
      // Given a pending task
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [createQuestion()],
        userId: mockUserId,
      });

      // Verify initial state
      expect(task.getStatus()).toBe(QuizGenerationStatus.PENDING);
      expect(task.getGeneratedAt()).toBe(null);

      // When setting status to IN_PROGRESS
      task.updateStatus(QuizGenerationStatus.IN_PROGRESS);

      // Then status should change but generatedAt should remain null
      expect(task.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
      expect(task.getGeneratedAt()).toBe(null);

      // When setting status to COMPLETED
      const beforeCompleted = new Date();
      task.updateStatus(QuizGenerationStatus.COMPLETED);
      const afterCompleted = new Date();

      // Then status should change and generatedAt should be set
      expect(task.getStatus()).toBe(QuizGenerationStatus.COMPLETED);
      expect(task.getGeneratedAt()).toBeInstanceOf(Date);
      expect(task.isGenerationComplete()).toBe(true);

      // Verify the timestamp is between before and after
      const generatedAt = task.getGeneratedAt() as Date;
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCompleted.getTime(),
      );
      expect(generatedAt.getTime()).toBeLessThanOrEqual(
        afterCompleted.getTime(),
      );
    });

    it("should mark task as FAILED", () => {
      // Given a pending task
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [],
        userId: mockUserId,
      });

      // When setting status to FAILED
      task.updateStatus(QuizGenerationStatus.FAILED);

      // Then the status should be FAILED and not complete
      expect(task.getStatus()).toBe(QuizGenerationStatus.FAILED);
      expect(task.isGenerationComplete()).toBe(false);
    });
  });

  describe("Question management", () => {
    it("should add a question to the task", () => {
      // Given a task with initial questions
      const initialQuestion = createQuestion();
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [initialQuestion],
        userId: mockUserId,
      });

      const initialCount = task.getQuestions().length;

      // When adding a new question
      const newQuestion = createQuestion();
      task.addQuestion(newQuestion);

      // Then the question should be added and count increased
      const questions = task.getQuestions();
      expect(questions.length).toBe(initialCount + 1);
      expect(questions).toContain(newQuestion);

      // And the updatedAt timestamp should be updated
      expect(task.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe("Metadata management", () => {
    it("should return correct user ID", () => {
      // Given a task with a specific user ID
      const userId = faker.internet.email();
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [],
        userId,
      });

      // When getting the user ID
      // Then it should match the provided value
      expect(task.getUserId()).toBe(userId);
    });

    it("should set and get title correctly", () => {
      // Given a task
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [],
        userId: mockUserId,
      });
      const title = faker.lorem.sentence();

      // When setting a title
      task.setTitle(title);

      // Then the title should be stored correctly
      expect(task.getTitle()).toBe(title);
    });

    it("should set and get category correctly", () => {
      // Given a task
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [],
        userId: mockUserId,
      });
      const category = faker.word.noun();

      // When setting a category
      task.setCategory(category);

      // Then the category should be stored correctly
      expect(task.getCategory()).toBe(category);
    });

    it("should create a task with initial title and category values", () => {
      // Given title and category values
      const textContent = faker.lorem.paragraph();
      const title = faker.lorem.sentence();
      const category = faker.word.noun();

      // When creating a task with these values
      const task = new QuizGenerationTask({
        textContent,
        questions: [],
        userId: mockUserId,
        title,
        category,
      });

      // Then the values should be set correctly
      expect(task.getTitle()).toBe(title);
      expect(task.getCategory()).toBe(category);
    });

    it("should have null as default value for title and category", () => {
      // When creating a task without title and category
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraph(),
        questions: [],
        userId: mockUserId,
      });

      // Then they should default to null
      expect(task.getTitle()).toBeNull();
      expect(task.getCategory()).toBeNull();
    });
  });
});
