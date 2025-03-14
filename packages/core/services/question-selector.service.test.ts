import { faker } from "@faker-js/faker";
import { QuestionSelector } from "./question-selector.service";
import { Question } from "../entities/question";
import { UserAnswer } from "../entities/user_answer";

describe("QuestionSelector", () => {
  let selector: QuestionSelector;

  const createMockQuestion = (id: string) =>
    ({
      getId: () => id,
      getContent: () => `Question ${id}`,
    }) as Question;

  const mockQuestions = [
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
    createMockQuestion(faker.string.uuid()),
  ];

  const userId = faker.string.uuid();
  const createMockUserAnswer = (questionId: string) =>
    ({
      getUserId: () => userId,
      getQuestionId: () => questionId,
    }) as UserAnswer;

  beforeEach(() => {
    selector = new QuestionSelector();
  });

  it("should select random unanswered questions when there are enough of them", () => {
    const userAnswers = [createMockUserAnswer(mockQuestions[0].getId())];

    const result = selector.selectQuestions(mockQuestions, userAnswers, 3);

    expect(result.length).toBe(3);
    expect(result.map((q) => q.getId())).not.toContain(
      mockQuestions[0].getId(),
    );
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
});
