import { faker } from "@faker-js/faker";
import { QuestionSelector } from "./question-selector.service";
import { Question } from "../entities/question";
import { UserAnswer } from "../entities/user-answer";

describe("QuestionSelector", () => {
  let selector: QuestionSelector;

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

  // Create a fixed set of questions for more predictable tests
  let mockQuestions: Question[];

  beforeEach(() => {
    selector = new QuestionSelector();

    // Reset mock questions for each test to ensure isolation
    mockQuestions = [
      createMockQuestion(faker.string.uuid()),
      createMockQuestion(faker.string.uuid()),
      createMockQuestion(faker.string.uuid()),
      createMockQuestion(faker.string.uuid()),
      createMockQuestion(faker.string.uuid()),
    ];
  });

  describe("selectQuestions", () => {
    it("should select random unanswered questions when there are enough of them", () => {
      const userAnswers = [createMockUserAnswer(mockQuestions[0].getId())];

      const result = selector.selectQuestions(mockQuestions, userAnswers, 3);

      expect(result.length).toBe(3);
      expect(result.map((q) => q.getId())).not.toContain(
        mockQuestions[0].getId(),
      );
      // All selected questions should be from the original list
      result.forEach((question) => {
        expect(
          mockQuestions.some((q) => q.getId() === question.getId()),
        ).toBeTruthy();
      });
    });

    it("should combine unanswered and least answered questions when needed", () => {
      const userAnswers = [
        createMockUserAnswer(mockQuestions[0].getId()),
        createMockUserAnswer(mockQuestions[1].getId()),
        createMockUserAnswer(mockQuestions[2].getId()),
        createMockUserAnswer(mockQuestions[0].getId()),
        createMockUserAnswer(mockQuestions[1].getId()),
      ];

      const result = selector.selectQuestions(mockQuestions, userAnswers, 3);

      expect(result.length).toBe(3);

      // Should include the 2 unanswered questions
      const resultIds = result.map((q) => q.getId());
      expect(resultIds).toContain(mockQuestions[3].getId());
      expect(resultIds).toContain(mockQuestions[4].getId());

      // Should include the least frequently answered question (question 2, answered once)
      expect(resultIds).toContain(mockQuestions[2].getId());
    });

    it("should select least frequently answered questions when all are answered", () => {
      const userAnswers = [
        // Different answer frequencies
        createMockUserAnswer(mockQuestions[0].getId()),
        createMockUserAnswer(mockQuestions[0].getId()),
        createMockUserAnswer(mockQuestions[1].getId()),
        createMockUserAnswer(mockQuestions[1].getId()),
        createMockUserAnswer(mockQuestions[1].getId()),
        createMockUserAnswer(mockQuestions[2].getId()),
        createMockUserAnswer(mockQuestions[3].getId()),
        createMockUserAnswer(mockQuestions[4].getId()),
        createMockUserAnswer(mockQuestions[4].getId()),
      ];

      const result = selector.selectQuestions(mockQuestions, userAnswers, 2);

      expect(result.length).toBe(2);

      // Should select the questions with lowest frequency (2 and 3, answered once each)
      const resultIds = result.map((q) => q.getId());
      expect(resultIds).toContain(mockQuestions[2].getId());
      expect(resultIds).toContain(mockQuestions[3].getId());
    });

    it("should respect the limit parameter", () => {
      const result = selector.selectQuestions(mockQuestions, [], 2);
      expect(result.length).toBe(2);
    });

    it("should return empty array when limit is 0", () => {
      const result = selector.selectQuestions(mockQuestions, [], 0);
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });
  });

  describe("selectQuestionsWithAnsweredIds", () => {
    it("should select unanswered questions when there are enough", () => {
      const answeredQuestionIds = [
        mockQuestions[0].getId(),
        mockQuestions[1].getId(),
      ];

      const result = selector.selectQuestionsWithAnsweredIds(
        mockQuestions,
        answeredQuestionIds,
        3,
      );

      expect(result.length).toBe(3);
      // Result should only contain questions that weren't in answeredQuestionIds
      const resultIds = result.map((q) => q.getId());
      expect(resultIds).not.toContain(mockQuestions[0].getId());
      expect(resultIds).not.toContain(mockQuestions[1].getId());
      expect(resultIds).toContain(mockQuestions[2].getId());
      expect(resultIds).toContain(mockQuestions[3].getId());
      expect(resultIds).toContain(mockQuestions[4].getId());
    });

    it("should combine unanswered and answered questions when needed", () => {
      const answeredQuestionIds = [
        mockQuestions[0].getId(),
        mockQuestions[1].getId(),
        mockQuestions[2].getId(),
      ];

      const result = selector.selectQuestionsWithAnsweredIds(
        mockQuestions,
        answeredQuestionIds,
        4,
      );

      expect(result.length).toBe(4);

      // Result must include all unanswered questions
      const resultIds = result.map((q) => q.getId());
      expect(resultIds).toContain(mockQuestions[3].getId());
      expect(resultIds).toContain(mockQuestions[4].getId());

      // And must include some answered questions to reach the limit
      const answeredInResult = answeredQuestionIds.filter((id) =>
        resultIds.includes(id),
      );
      expect(answeredInResult.length).toBe(2); // We need 2 answered questions to reach limit of 4
    });

    it("should select from answered questions when all questions are answered", () => {
      const answeredQuestionIds = mockQuestions.map((q) => q.getId());

      const result = selector.selectQuestionsWithAnsweredIds(
        mockQuestions,
        answeredQuestionIds,
        3,
      );

      expect(result.length).toBe(3);
      // All questions should be from the answered set
      const resultIds = result.map((q) => q.getId());
      resultIds.forEach((id) => {
        expect(answeredQuestionIds).toContain(id);
      });
    });

    it("should respect the limit parameter", () => {
      const result = selector.selectQuestionsWithAnsweredIds(
        mockQuestions,
        [],
        2,
      );
      expect(result.length).toBe(2);
    });
  });

  describe("selectQuestionsWithFrequencies", () => {
    it("should select questions with frequency 0 when there are enough", () => {
      const questionFrequencies = new Map<string, number>([
        [mockQuestions[0].getId(), 2],
        [mockQuestions[1].getId(), 1],
      ]);

      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        questionFrequencies,
        3,
      );

      expect(result.length).toBe(3);

      // Result should prioritize questions with frequency 0 (not in the map)
      const resultIds = result.map((q) => q.getId());
      expect(resultIds).toContain(mockQuestions[2].getId());
      expect(resultIds).toContain(mockQuestions[3].getId());
      expect(resultIds).toContain(mockQuestions[4].getId());
    });

    it("should prioritize by frequency when not enough unanswered questions", () => {
      const questionFrequencies = new Map<string, number>([
        [mockQuestions[0].getId(), 3],
        [mockQuestions[1].getId(), 2],
        [mockQuestions[2].getId(), 1],
        [mockQuestions[3].getId(), 4],
      ]);

      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        questionFrequencies,
        3,
      );

      expect(result.length).toBe(3);

      const resultIds = result.map((q) => q.getId());

      // Should include the unanswered question
      expect(resultIds).toContain(mockQuestions[4].getId());

      // Should include the lowest frequency questions
      expect(resultIds).toContain(mockQuestions[2].getId()); // freq = 1
      expect(resultIds).toContain(mockQuestions[1].getId()); // freq = 2

      // Should not include higher frequency questions
      expect(resultIds).not.toContain(mockQuestions[0].getId()); // freq = 3
      expect(resultIds).not.toContain(mockQuestions[3].getId()); // freq = 4
    });

    it("should handle the case where all questions have frequencies", () => {
      const questionFrequencies = new Map<string, number>(
        mockQuestions.map((q, i) => [q.getId(), i + 1]),
      );

      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        questionFrequencies,
        3,
      );

      expect(result.length).toBe(3);

      // Should prioritize lowest frequency questions
      const resultIds = result.map((q) => q.getId());
      expect(resultIds).toContain(mockQuestions[0].getId()); // freq = 1
      expect(resultIds).toContain(mockQuestions[1].getId()); // freq = 2
      expect(resultIds).toContain(mockQuestions[2].getId()); // freq = 3
    });

    it("should respect the limit parameter and randomize results", () => {
      // Run the test multiple times to check randomization
      const runs = 10;
      const resultSets: string[][] = [];

      for (let i = 0; i < runs; i++) {
        const result = selector.selectQuestionsWithFrequencies(
          mockQuestions,
          new Map(),
          2,
        );
        expect(result.length).toBe(2);
        resultSets.push(result.map((q) => q.getId()).sort());
      }

      // Check that we got at least 2 different combinations (this is probabilistic)
      // The chance of getting the same combination 10 times in a row is very low
      const uniqueSets = new Set(resultSets.map((set) => JSON.stringify(set)));
      expect(uniqueSets.size).toBeGreaterThan(1);
    });

    it("should handle empty frequency map correctly", () => {
      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        new Map(),
        3,
      );

      expect(result.length).toBe(3);
      // All questions should be treated as unanswered
      result.forEach((question) => {
        expect(
          mockQuestions.some((q) => q.getId() === question.getId()),
        ).toBeTruthy();
      });
    });

    it("should handle zero frequencies as unanswered questions", () => {
      const questionFrequencies = new Map<string, number>([
        [mockQuestions[0].getId(), 0],
        [mockQuestions[1].getId(), 1],
        [mockQuestions[2].getId(), 0],
        [mockQuestions[3].getId(), 2],
      ]);

      const result = selector.selectQuestionsWithFrequencies(
        mockQuestions,
        questionFrequencies,
        2,
      );

      expect(result.length).toBe(2);

      // Should prioritize questions with frequency 0
      const resultIds = result.map((q) => q.getId());
      const zeroFreqIds = [
        mockQuestions[0].getId(),
        mockQuestions[2].getId(),
        mockQuestions[4].getId(),
      ]; // Include question 4 which isn't in the map (implicitly zero)

      // Each result ID should be one of the zero frequency IDs
      resultIds.forEach((id) => {
        expect(zeroFreqIds).toContain(id);
      });

      // Should not include any non-zero frequency questions
      expect(resultIds).not.toContain(mockQuestions[1].getId()); // freq = 1
      expect(resultIds).not.toContain(mockQuestions[3].getId()); // freq = 2
    });
  });
});
