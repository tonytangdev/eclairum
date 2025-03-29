import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { Feature } from "./feature";
import { RequiredFieldError } from "../errors/validation-errors";

describe("Feature", () => {
  // Helper function to create valid feature parameters
  const createValidFeatureParams = () => ({
    name: faker.commerce.productName(),
    key: faker.helpers.slugify(faker.commerce.productName()).replace(/-/g, "_"),
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
    it("should create a feature with minimum required properties", () => {
      // Arrange
      const params = createValidFeatureParams();

      // Act
      const feature = new Feature(params);

      // Assert
      expect(feature).toBeInstanceOf(Feature);
      expect(feature.getName()).toBe(params.name);
      expect(feature.getKey()).toBe(params.key.toLowerCase());
      expect(feature.getId()).toEqual(expect.any(String));
      expect(feature.getCreatedAt()).toEqual(expect.any(Date));
      expect(feature.getUpdatedAt()).toEqual(expect.any(Date));
      expect(feature.getDescription()).toBeNull();
    });

    it("should create a feature with all custom properties", () => {
      // Arrange
      const id = randomUUID();
      const name = faker.commerce.productName();
      const key = "premium_analytics";
      const description = faker.commerce.productDescription();
      const createdAt = new Date(2023, 1, 1);
      const updatedAt = new Date(2023, 1, 2);

      // Act
      const feature = new Feature({
        id,
        name,
        key,
        description,
        createdAt,
        updatedAt,
      });

      // Assert
      expect(feature.getId()).toBe(id);
      expect(feature.getName()).toBe(name);
      expect(feature.getKey()).toBe(key);
      expect(feature.getDescription()).toBe(description);
      expect(feature.getCreatedAt()).toBe(createdAt);
      expect(feature.getUpdatedAt()).toBe(updatedAt);
    });

    it("should throw RequiredFieldError when name is empty", () => {
      // Arrange
      const params = { ...createValidFeatureParams(), name: "" };

      // Act & Assert
      expect(() => new Feature(params)).toThrow(RequiredFieldError);
      expect(() => new Feature(params)).toThrow("name is required for Feature");
    });

    it("should throw RequiredFieldError when key is empty", () => {
      // Arrange
      const params = { ...createValidFeatureParams(), key: "" };

      // Act & Assert
      expect(() => new Feature(params)).toThrow(RequiredFieldError);
      expect(() => new Feature(params)).toThrow("key is required for Feature");
    });

    it("should throw error for invalid key format with special characters", () => {
      // Arrange
      const params = { ...createValidFeatureParams(), key: "invalid-key!" };

      // Act & Assert
      expect(() => new Feature(params)).toThrow(
        "Feature key must contain only letters, numbers, and underscores",
      );
    });

    it("should convert key to lowercase", () => {
      // Arrange
      const params = { ...createValidFeatureParams(), key: "PREMIUM_FEATURE" };

      // Act
      const feature = new Feature(params);

      // Assert
      expect(feature.getKey()).toBe("premium_feature");
    });
  });

  describe("setters and state changes", () => {
    it("should update name correctly", () => {
      // Arrange
      const feature = new Feature(createValidFeatureParams());
      const originalUpdatedAt = feature.getUpdatedAt();
      const newName = faker.commerce.productName();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      feature.setName(newName);

      // Assert
      expect(feature.getName()).toBe(newName);
      expect(feature.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should throw RequiredFieldError when setting empty name", () => {
      // Arrange
      const feature = new Feature(createValidFeatureParams());

      // Act & Assert
      expect(() => feature.setName("")).toThrow(RequiredFieldError);
    });

    it("should update key correctly", () => {
      // Arrange
      const feature = new Feature(createValidFeatureParams());
      const originalUpdatedAt = feature.getUpdatedAt();
      const newKey = "new_feature_key";

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      feature.setKey(newKey);

      // Assert
      expect(feature.getKey()).toBe(newKey);
      expect(feature.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should throw RequiredFieldError when setting empty key", () => {
      // Arrange
      const feature = new Feature(createValidFeatureParams());

      // Act & Assert
      expect(() => feature.setKey("")).toThrow(RequiredFieldError);
    });

    it("should throw error when setting invalid key format", () => {
      // Arrange
      const feature = new Feature(createValidFeatureParams());

      // Act & Assert
      expect(() => feature.setKey("invalid-key!")).toThrow(
        "Feature key must contain only letters, numbers, and underscores",
      );
    });

    it("should update description correctly", () => {
      // Arrange
      const feature = new Feature(createValidFeatureParams());
      const originalUpdatedAt = feature.getUpdatedAt();
      const newDescription = faker.commerce.productDescription();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      feature.setDescription(newDescription);

      // Assert
      expect(feature.getDescription()).toBe(newDescription);
      expect(feature.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });
});
