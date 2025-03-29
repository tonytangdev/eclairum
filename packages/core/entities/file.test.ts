import { faker } from "@faker-js/faker";
import { File } from "./file";

describe("File", () => {
  // Test data
  const createValidFileParams = () => ({
    path: faker.system.filePath(),
    bucketName: "test-bucket",
    quizGenerationTaskId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a File instance with valid parameters", () => {
      // Arrange
      const params = createValidFileParams();

      // Act
      const file = new File(params);

      // Assert
      expect(file).toBeInstanceOf(File);
      expect(file.getId()).toBeDefined();
      expect(file.getPath()).toBe(params.path);
      expect(file.getBucketName()).toBe(params.bucketName);
      expect(file.getQuizGenerationTaskId()).toBe(params.quizGenerationTaskId);
      expect(file.getCreatedAt()).toEqual(params.createdAt);
      expect(file.getUpdatedAt()).toEqual(params.updatedAt);
      expect(file.getDeletedAt()).toBeNull();
    });

    it("should create a File instance with custom id", () => {
      // Arrange
      const customId = faker.string.uuid();
      const params = { ...createValidFileParams(), id: customId };

      // Act
      const file = new File(params);

      // Assert
      expect(file.getId()).toBe(customId);
    });

    it("should throw an error when path is not provided", () => {
      // Arrange
      const params = { ...createValidFileParams(), path: "" };

      // Act & Assert
      expect(() => new File(params)).toThrow("File path is required");
    });

    it("should throw an error when bucket name is not provided", () => {
      // Arrange
      const params = { ...createValidFileParams(), bucketName: "" };

      // Act & Assert
      expect(() => new File(params)).toThrow("Bucket name is required");
    });

    it("should throw an error when quiz generation task ID is not provided", () => {
      // Arrange
      const params = { ...createValidFileParams(), quizGenerationTaskId: "" };

      // Act & Assert
      expect(() => new File(params)).toThrow(
        "Quiz generation task ID is required",
      );
    });
  });

  describe("setPath", () => {
    it("should update the file path and update date", () => {
      // Arrange
      const file = new File(createValidFileParams());
      const originalUpdatedAt = file.getUpdatedAt();
      const newPath = faker.system.filePath();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      file.setPath(newPath);

      // Assert
      expect(file.getPath()).toBe(newPath);
      expect(file.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe("delete and restore", () => {
    it("should mark the file as deleted", () => {
      // Arrange
      const file = new File(createValidFileParams());
      const originalUpdatedAt = file.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      file.delete();

      // Assert
      expect(file.isDeleted()).toBe(true);
      expect(file.getDeletedAt()).not.toBeNull();
      expect(file.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should restore a deleted file", () => {
      // Arrange
      const file = new File(createValidFileParams());
      file.delete();
      const deletedUpdatedAt = file.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      file.restore();

      // Assert
      expect(file.isDeleted()).toBe(false);
      expect(file.getDeletedAt()).toBeNull();
      expect(file.getUpdatedAt().getTime()).toBeGreaterThan(
        deletedUpdatedAt.getTime(),
      );
    });
  });
});
