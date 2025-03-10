import { faker } from "@faker-js/faker";
import { UserAnswer } from "./user_answer";
import { Answer } from "./answer";
import { InvalidAnswerError } from "../errors/user-answer-errors";

describe("UserAnswer", () => {
  const mockUserId = faker.string.uuid();
  const mockQuestionId = faker.string.uuid();
  const mockAnswerId = faker.string.uuid();

  // Create a mock Answer object for testing
  const createMockAnswer = (isCorrect: boolean = true) => {
    return {
      getId: () => mockAnswerId,
      getContent: () => "This is the answer content",
      getIsCorrect: () => isCorrect,
      getCreatedAt: () => new Date(),
      getUpdatedAt: () => new Date(),
      getDeletedAt: () => null,
      getQuestionId: () => mockQuestionId,
    } as Answer;
  };

  describe("constructor", () => {
    it("should create a UserAnswer with valid parameters", () => {
      const mockAnswer = createMockAnswer();
      const userAnswer = new UserAnswer({
        userId: mockUserId,
        questionId: mockQuestionId,
        answer: mockAnswer,
      });

      expect(userAnswer).toBeInstanceOf(UserAnswer);
      expect(userAnswer.getId()).toBeDefined();
      expect(userAnswer.getUserId()).toBe(mockUserId);
      expect(userAnswer.getQuestionId()).toBe(mockQuestionId);
      expect(userAnswer.getAnswer()).toBe(mockAnswer);
      expect(userAnswer.getAnswerId()).toBe(mockAnswerId);
      expect(userAnswer.getCreatedAt()).toBeInstanceOf(Date);
      expect(userAnswer.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it("should create a UserAnswer with provided id and timestamps", () => {
      const mockId = faker.string.uuid();
      const mockDate = faker.date.past();
      const mockAnswer = createMockAnswer();

      const userAnswer = new UserAnswer({
        id: mockId,
        userId: mockUserId,
        questionId: mockQuestionId,
        answer: mockAnswer,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      expect(userAnswer.getId()).toBe(mockId);
      expect(userAnswer.getCreatedAt()).toEqual(mockDate);
      expect(userAnswer.getUpdatedAt()).toEqual(mockDate);
    });

    it("should throw InvalidAnswerError when userId is not provided", () => {
      const mockAnswer = createMockAnswer();

      expect(() => {
        new UserAnswer({
          userId: "",
          questionId: mockQuestionId,
          answer: mockAnswer,
        });
      }).toThrow(InvalidAnswerError);

      expect(() => {
        new UserAnswer({
          userId: "",
          questionId: mockQuestionId,
          answer: mockAnswer,
        });
      }).toThrow("User ID is required");
    });

    it("should throw InvalidAnswerError when questionId is not provided", () => {
      const mockAnswer = createMockAnswer();

      expect(() => {
        new UserAnswer({
          userId: mockUserId,
          questionId: "",
          answer: mockAnswer,
        });
      }).toThrow(InvalidAnswerError);

      expect(() => {
        new UserAnswer({
          userId: mockUserId,
          questionId: "",
          answer: mockAnswer,
        });
      }).toThrow("Question ID is required");
    });

    it("should throw InvalidAnswerError when answer is not provided", () => {
      expect(() => {
        new UserAnswer({
          userId: mockUserId,
          questionId: mockQuestionId,
          answer: null as unknown as Answer,
        });
      }).toThrow(InvalidAnswerError);

      expect(() => {
        new UserAnswer({
          userId: mockUserId,
          questionId: mockQuestionId,
          answer: null as unknown as Answer,
        });
      }).toThrow("Answer is required");
    });
  });

  describe("isCorrect", () => {
    it("should return true when answer is correct", () => {
      const mockAnswer = createMockAnswer(true);
      const userAnswer = new UserAnswer({
        userId: mockUserId,
        questionId: mockQuestionId,
        answer: mockAnswer,
      });

      expect(userAnswer.isCorrect()).toBe(true);
    });

    it("should return false when answer is incorrect", () => {
      const mockAnswer = createMockAnswer(false);
      const userAnswer = new UserAnswer({
        userId: mockUserId,
        questionId: mockQuestionId,
        answer: mockAnswer,
      });

      expect(userAnswer.isCorrect()).toBe(false);
    });
  });

  describe("getters", () => {
    it("should return the correct values", () => {
      const customId = faker.string.uuid();
      const customUserId = faker.string.uuid();
      const customQuestionId = faker.string.uuid();
      const creationDate = new Date("2023-01-01");
      const updateDate = new Date("2023-01-02");
      const mockAnswer = createMockAnswer();

      const userAnswer = new UserAnswer({
        id: customId,
        userId: customUserId,
        questionId: customQuestionId,
        answer: mockAnswer,
        createdAt: creationDate,
        updatedAt: updateDate,
      });

      expect(userAnswer.getId()).toBe(customId);
      expect(userAnswer.getUserId()).toBe(customUserId);
      expect(userAnswer.getQuestionId()).toBe(customQuestionId);
      expect(userAnswer.getAnswer()).toBe(mockAnswer);
      expect(userAnswer.getCreatedAt()).toEqual(creationDate);
      expect(userAnswer.getUpdatedAt()).toEqual(updateDate);
    });

    it("should provide access to the answer ID through getAnswerId()", () => {
      const mockAnswer = createMockAnswer();
      const userAnswer = new UserAnswer({
        userId: mockUserId,
        questionId: mockQuestionId,
        answer: mockAnswer,
      });

      expect(userAnswer.getAnswerId()).toBe(mockAnswerId);
    });
  });
});
