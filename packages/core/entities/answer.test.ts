import { Answer } from "./answer";

describe("Answer", () => {
  // Mock crypto.randomUUID for predictable tests
  const originalRandomUUID = crypto.randomUUID;
  const mockUUID = "mock-uuid-12345";

  beforeAll(() => {
    crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);
  });

  afterAll(() => {
    crypto.randomUUID = originalRandomUUID;
  });

  it("should create a valid answer with all properties", () => {
    const answer = new Answer({
      content: "Paris",
      isCorrect: true,
    });

    expect(answer).toBeInstanceOf(Answer);
    expect(answer.getContent()).toBe("Paris");
    expect(answer.getIsCorrect()).toBe(true);
    expect(answer.getId()).toBe(mockUUID);
  });

  it("should use provided ID when available", () => {
    const customId = "custom-id-123";
    const answer = new Answer({
      id: customId,
      content: "Berlin",
      isCorrect: false,
    });

    expect(answer.getId()).toBe(customId);
  });

  it("should throw error when content is empty", () => {
    expect(() => {
      new Answer({
        content: "",
        isCorrect: true,
      });
    }).toThrow("Content is required");
  });

  it("should return correct values from getter methods", () => {
    const testId = "test-id-456";
    const testContent = "Tokyo";
    const testIsCorrect = true;

    const answer = new Answer({
      id: testId,
      content: testContent,
      isCorrect: testIsCorrect,
    });

    expect(answer.getId()).toBe(testId);
    expect(answer.getContent()).toBe(testContent);
    expect(answer.getIsCorrect()).toBe(testIsCorrect);
  });
});
