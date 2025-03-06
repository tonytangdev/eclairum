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
});
