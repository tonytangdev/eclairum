import { faker } from "@faker-js/faker";
import { Answer } from "./answer";
import { randomUUID } from "crypto";
import { RequiredContentError } from "../errors/validation-errors";

describe("Answer", () => {
  it("should create a valid answer with all properties", () => {
    const questionId = randomUUID();
    const content = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    const answer = new Answer({
      content,
      isCorrect,
      questionId,
    });

    expect(answer).toStrictEqual(expect.any(Answer));
    expect(answer.getContent()).toStrictEqual(content);
    expect(answer.getIsCorrect()).toStrictEqual(isCorrect);
    expect(answer.getId()).toStrictEqual(expect.any(String));
    expect(answer.getCreatedAt()).toStrictEqual(expect.any(Date));
    expect(answer.getUpdatedAt()).toStrictEqual(expect.any(Date));
    expect(answer.getDeletedAt()).toStrictEqual(null);
    expect(answer.getQuestionId()).toStrictEqual(questionId);
  });

  it("should use provided ID when available", () => {
    const customId = randomUUID();
    const questionId = randomUUID();
    const content = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();
    const answer = new Answer({
      id: customId,
      content,
      isCorrect,
      questionId,
    });

    expect(answer.getId()).toStrictEqual(customId);
    expect(answer.getContent()).toStrictEqual(content);
    expect(answer.getIsCorrect()).toStrictEqual(isCorrect);
    expect(answer.getQuestionId()).toStrictEqual(questionId);
    expect(answer.getCreatedAt()).toStrictEqual(expect.any(Date));
    expect(answer.getUpdatedAt()).toStrictEqual(expect.any(Date));
    expect(answer.getDeletedAt()).toStrictEqual(null);
  });

  it("should throw RequiredContentError when content is empty", () => {
    expect(() => {
      new Answer({
        content: "",
        isCorrect: true,
        questionId: randomUUID(),
      });
    }).toThrow(RequiredContentError);
    expect(() => {
      new Answer({
        content: "",
        isCorrect: true,
        questionId: randomUUID(),
      });
    }).toThrow("Content is required for Answer");
  });

  it("should return correct values from getter methods", () => {
    const testId = randomUUID();
    const content = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();
    const questionId = randomUUID();

    const answer = new Answer({
      id: testId,
      content,
      isCorrect,
      questionId,
    });

    expect(answer.getId()).toStrictEqual(expect.any(String));
    expect(answer.getContent()).toStrictEqual(content);
    expect(answer.getIsCorrect()).toStrictEqual(isCorrect);
    expect(answer.getCreatedAt()).toStrictEqual(expect.any(Date));
    expect(answer.getUpdatedAt()).toStrictEqual(expect.any(Date));
    expect(answer.getDeletedAt()).toStrictEqual(null);
    expect(answer.getQuestionId()).toStrictEqual(questionId);
  });

  it("should update content correctly using setContent method", () => {
    const questionId = randomUUID();
    const originalContent = faker.lorem.sentence();
    const newContent = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    const answer = new Answer({
      content: originalContent,
      isCorrect,
      questionId,
    });

    answer.setContent(newContent);

    expect(answer.getContent()).toStrictEqual(newContent);
  });

  it("should throw RequiredContentError when setting empty content", () => {
    const questionId = randomUUID();
    const originalContent = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();

    const answer = new Answer({
      content: originalContent,
      isCorrect,
      questionId,
    });

    expect(() => {
      answer.setContent("");
    }).toThrow(RequiredContentError);
  });

  it("should update isCorrect correctly using setIsCorrect method", () => {
    const questionId = randomUUID();
    const content = faker.lorem.sentence();
    const originalIsCorrect = faker.datatype.boolean();
    const newIsCorrect = !originalIsCorrect;

    const answer = new Answer({
      content,
      isCorrect: originalIsCorrect,
      questionId,
    });

    answer.setIsCorrect(newIsCorrect);

    expect(answer.getIsCorrect()).toStrictEqual(newIsCorrect);
  });

  it("should update deletedAt correctly using setDeletedAt method", () => {
    const questionId = randomUUID();
    const content = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();
    const deletedAt = new Date();

    const answer = new Answer({
      content,
      isCorrect,
      questionId,
    });

    answer.setDeletedAt(deletedAt);

    expect(answer.getDeletedAt()).toStrictEqual(deletedAt);
  });

  it("should update updatedAt correctly using setUpdatedAt method", () => {
    const questionId = randomUUID();
    const content = faker.lorem.sentence();
    const isCorrect = faker.datatype.boolean();
    const updatedAt = new Date();

    const answer = new Answer({
      content,
      isCorrect,
      questionId,
    });

    answer.setUpdatedAt(updatedAt);

    expect(answer.getUpdatedAt()).toStrictEqual(updatedAt);
  });
});
