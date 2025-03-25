import { faker } from "@faker-js/faker";
import { QuestionSelector } from "./question-selector.service";
import { Question } from "../entities/question";
import { UserAnswer } from "../entities/user-answer";

describe("QuestionSelector", () => {
  let selector: QuestionSelector;

  // Create predictable test data for consistent assertions
  const createMockQuestion = (id: string) =>
    ({
      getId: () => id,
      getContent: () => `Question ${id}`,
    }) as Question;

  const userId = faker.string.uuid();
  const createMockUserAnswer = (questionId: string) =>
    ({
      getUserId: () => userId,
      getQuestionId: () => questionId,
    }) as UserAnswer;

  // Generate a fixed set of question IDs for consistent tests
  let questionIds: string[];
  let mockQuestions: Question[];

  beforeEach(() => {
    selector = new QuestionSelector();

    // Generate consistent IDs for predictable tests
    questionIds = Array.from({ length: 10 }, (_, i) => `q${i + 1}`);

    // Create questions with these IDs
    mockQuestions = questionIds.map((id) => createMockQuestion(id));
  });

  describe("selectQuestions", () => {
    it("should prioritize unanswered questions when there are enough", () => {
      // Given user has answered two questions
      const userAnswers = [
        createMockUserAnswer(questionIds[0]),
        createMockUserAnswer(questionIds[1]),
      ];

      // When selecting 3 questions
      const result = selector.selectQuestions(mockQuestions, userAnswers, 3);

      // Then all selected questions should be unanswered ones
      expect(result.length).toBe(3);
      result.forEach((question) => {
        expect(question.getId()).not.toBe(questionIds[0]);
        expect(question.getId()).not.toBe(questionIds[1]);
      });
    });

    it("should combine unanswered with least frequently answered questions when needed", () => {
      // Given:
      // - Question 0: answered 3 times
      // - Question 1: answered 2 times
      // - Question 2: answered 1 time
      // - Others: unanswered
      const userAnswers = [
        // Question 0 answered 3 times
        createMockUserAnswer(questionIds[0]),
        createMockUserAnswer(questionIds[0]),
        createMockUserAnswer(questionIds[0]),
        // Question 1 answered 2 times
        createMockUserAnswer(questionIds[1]),
        createMockUserAnswer(questionIds[1]),
        // Question 2 answered 1 time
        createMockUserAnswer(questionIds[2]),
      ];

      // When selecting 8 questions
      const result = selector.selectQuestions(mockQuestions, userAnswers, 8);

      // Then all unanswered questions (7) should be included plus the least frequently answered
      expect(result.length).toBe(8);

      // The result should contain all unanswered questions (3-9)
      for (let i = 3; i < 10; i++) {
        expect(result.some((q) => q.getId() === questionIds[i])).toBeTruthy();
      }

      // And the least frequently answered question (2)
      expect(result.some((q) => q.getId() === questionIds[2])).toBeTruthy();

      // But not the more frequently answered questions (0 and 1)
      expect(result.some((q) => q.getId() === questionIds[0])).toBeFalsy();
      expect(result.some((q) => q.getId() === questionIds[1])).toBeFalsy();
    });

    it("should select least frequently answered questions when all are answered", () => {
      // Given all questions are answered with different frequencies
      const userAnswers = [
        createMockUserAnswer(questionIds[0]), // 1 time
        createMockUserAnswer(questionIds[1]),
        createMockUserAnswer(questionIds[1]), // 2 times
        createMockUserAnswer(questionIds[2]),
        createMockUserAnswer(questionIds[2]),
        createMockUserAnswer(questionIds[2]), // 3 times
        createMockUserAnswer(questionIds[3]), // 1 time
        createMockUserAnswer(questionIds[4]),
        createMockUserAnswer(questionIds[4]), // 2 times
        createMockUserAnswer(questionIds[5]),
        createMockUserAnswer(questionIds[5]),
        createMockUserAnswer(questionIds[5]), // 3 times
        createMockUserAnswer(questionIds[6]), // 1 time
        createMockUserAnswer(questionIds[7]),
        createMockUserAnswer(questionIds[7]), // 2 times
        createMockUserAnswer(questionIds[8]),
        createMockUserAnswer(questionIds[8]),
        createMockUserAnswer(questionIds[8]), // 3 times
        createMockUserAnswer(questionIds[9]), // 1 time
      ];

      // When selecting 4 questions
      const result = selector.selectQuestions(mockQuestions, userAnswers, 4);

      // Then the 4 least frequently answered questions should be selected (answered 1 time)
      expect(result.length).toBe(4);
      expect(result.some((q) => q.getId() === questionIds[0])).toBeTruthy();
      expect(result.some((q) => q.getId() === questionIds[3])).toBeTruthy();
      expect(result.some((q) => q.getId() === questionIds[6])).toBeTruthy();
      expect(result.some((q) => q.getId() === questionIds[9])).toBeTruthy();
    });

    it("should respect the limit parameter even when it's less than available questions", () => {
      // Given 10 questions and no user answers
      const userAnswers: UserAnswer[] = [];

      // When selecting 5 questions (less than available)
      const result = selector.selectQuestions(mockQuestions, userAnswers, 5);

      // Then only 5 questions should be returned
      expect(result.length).toBe(5);
    });

    it("should handle the case when limit exceeds available questions", () => {
      // Given only 10 questions
      const userAnswers: UserAnswer[] = [];

      // When requesting 15 questions
      const result = selector.selectQuestions(mockQuestions, userAnswers, 15);

      // Then all available questions should be returned
      expect(result.length).toBe(10);
    });

    it("should return empty array when limit is 0", () => {
      // Given questions exist
      // When selecting 0 questions
      const result = selector.selectQuestions(mockQuestions, [], 0);

      // Then result should be empty
      expect(result.length).toBe(0);
    });
  });

  describe("selectQuestionsWithAnsweredIds", () => {
    it("should prioritize unanswered questions", () => {
      // Given a set of answered question IDs
      const answeredIds = [questionIds[0], questionIds[1], questionIds[2]];

      // When selecting 4 questions
      const result = selector.selectQuestionsWithAnsweredIds(
        mockQuestions,
        answeredIds,
        4,
      );

      // Then all unanswered questions should be included
      expect(result.length).toBe(4);

      // Count how many unanswered questions are in the result
      const unansweredInResult = result.filter(
        (q) => !answeredIds.includes(q.getId()),
      );

      // All 7 unanswered questions should take priority, but only 4 fit the limit
      expect(unansweredInResult.length).toBe(4);
    });

    it("should combine unanswered and answered questions when needed", () => {
      // Given most questions are answered
      const answeredIds = questionIds.slice(0, 8); // 8 answered, 2 unanswered

      // When selecting 5 questions
      const result = selector.selectQuestionsWithAnsweredIds(
        mockQuestions,
        answeredIds,
        5,
      );

      // Then all unanswered and some answered questions should be included
      expect(result.length).toBe(5);

      // All unanswered questions should be included
      const unansweredIds = [questionIds[8], questionIds[9]];
      unansweredIds.forEach((id) => {
        expect(result.some((q) => q.getId() === id)).toBeTruthy();
      });

      // And 3 answered questions to make up the difference
      const answeredInResult = result.filter((q) =>
        answeredIds.includes(q.getId()),
      );
      expect(answeredInResult.length).toBe(3);
    });

    it("should randomize the question order", () => {
      // Given no questions are answered
      const answeredIds: string[] = [];

      // When running multiple selections
      const runs = 5;
      const results: string[][] = [];

      for (let i = 0; i < runs; i++) {
        const result = selector.selectQuestionsWithAnsweredIds(
          mockQuestions,
          answeredIds,
          5,
        );
        results.push(result.map((q) => q.getId()));
      }

      // Then the order should vary across runs
      const uniqueOrderings = new Set(results.map((r) => JSON.stringify(r)));
      expect(uniqueOrderings.size).toBeGreaterThan(1);
    });
  });

  describe("selectQuestionsWithFrequencies", () => {
    it("should prioritize questions with zero frequency", () => {
      // Given a frequency map with some questions having non-zero frequencies
      const frequencies = new Map<string, number>([
        [questionIds[0], 3],
        [questionIds[1], 2],
        [questionIds[2], 1],
      ]);

      // When selecting 5 questions
      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        frequencies,
        5,
      );

      // Then all zero-frequency questions should be included
      expect(result.length).toBe(5);

      // Verify all zero-frequency questions are included
      const zeroFreqIds = questionIds.slice(3); // IDs 3-9

      // Count how many zero-frequency questions are in the result
      // Since we asked for 5 but have 7 zero-frequency questions, we should get 5 of them
      const zeroFreqInResult = result.filter((q) =>
        zeroFreqIds.includes(q.getId()),
      );
      expect(zeroFreqInResult.length).toBe(5);
    });

    it("should select questions with lower frequencies when not enough zero-frequency questions", () => {
      // Given most questions have non-zero frequencies
      const frequencies = new Map<string, number>(
        questionIds.slice(0, 8).map((id, i) => [id, i + 1]),
      );
      // Questions 0-7 have frequencies 1-8, questions 8-9 have zero frequency

      // When selecting 5 questions
      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        frequencies,
        5,
      );

      // Then zero-frequency and lowest-frequency questions should be selected
      expect(result.length).toBe(5);

      // All zero-frequency questions should be included
      const zeroFreqIds = [questionIds[8], questionIds[9]];
      zeroFreqIds.forEach((id) => {
        expect(result.some((q) => q.getId() === id)).toBeTruthy();
      });

      // And the lowest frequency questions to make up the difference
      const lowFreqIds = [questionIds[0], questionIds[1], questionIds[2]]; // Frequencies 1, 2, 3

      // Count how many of the expected low-frequency questions are in the result
      // We need 3 of them to reach our limit of 5
      const lowFreqInResult = result.filter((q) =>
        lowFreqIds.includes(q.getId()),
      );
      expect(lowFreqInResult.length).toBe(3);
    });

    it("should handle empty frequency map by treating all questions as zero-frequency", () => {
      // Given an empty frequency map
      const frequencies = new Map<string, number>();

      // When selecting 5 questions
      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        frequencies,
        5,
      );

      // Then 5 random questions should be selected
      expect(result.length).toBe(5);

      // All questions should be from the original set
      result.forEach((q) => {
        expect(
          mockQuestions.some((mq) => mq.getId() === q.getId()),
        ).toBeTruthy();
      });
    });

    it("should handle explicit zero frequencies", () => {
      // Given a frequency map with explicit zeros and non-zeros
      const frequencies = new Map<string, number>([
        [questionIds[0], 0],
        [questionIds[1], 1],
        [questionIds[2], 0],
        [questionIds[3], 2],
      ]);

      // When selecting 3 questions
      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        frequencies,
        3,
      );

      // Then questions with explicit zero frequency should be prioritized
      expect(result.length).toBe(3);

      // Combine explicit zeros and implicit zeros (not in the map)
      const zeroFreqIds = [
        questionIds[0], // Explicit zero
        questionIds[2], // Explicit zero
        ...questionIds.slice(4), // Implicit zeros (not in map)
      ];

      // All selected questions should have zero frequency
      result.forEach((q) => {
        expect(zeroFreqIds).toContain(q.getId());
      });
    });
  });
});
