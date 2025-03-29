import { Feature } from "./feature";
import { faker } from "@faker-js/faker";
import { InvalidFeatureUsageLimitError } from "../errors/feature-errors";

describe("Feature", () => {
  describe("constructor", () => {
    it("should create a feature with default values when only name is provided", () => {
      // Arrange
      const featureName = faker.word.sample();

      // Act
      const feature = new Feature({ name: featureName });

      // Assert
      expect(feature.getId()).toBeTruthy();
      expect(feature.getName()).toBe(featureName);
      expect(feature.getMaxUsage()).toBeNull();
      expect(feature.getCreatedAt()).toBeInstanceOf(Date);
      expect(feature.getUpdatedAt()).toBeInstanceOf(Date);
      expect(feature.getDeletedAt()).toBeNull();
      expect(feature.getIsEnabled()).toBe(true);
    });

    it("should generate a UUID when id is not provided", () => {
      // Arrange & Act
      const feature = new Feature({ name: faker.word.sample() });

      // Assert
      expect(feature.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should create a feature with custom values", () => {
      // Arrange
      const id = faker.string.uuid();
      const name = faker.word.sample();
      const maxUsage = faker.number.int({ min: 1, max: 100 });
      const createdAt = new Date(2023, 0, 1);
      const updatedAt = new Date(2023, 0, 2);
      const deletedAt = new Date(2023, 0, 3);
      const isEnabled = false;

      // Act
      const feature = new Feature({
        id,
        name,
        maxUsage,
        createdAt,
        updatedAt,
        deletedAt,
        isEnabled,
      });

      // Assert
      expect(feature.getId()).toBe(id);
      expect(feature.getName()).toBe(name);
      expect(feature.getMaxUsage()).toBe(maxUsage);
      expect(feature.getCreatedAt()).toBe(createdAt);
      expect(feature.getUpdatedAt()).toBe(updatedAt);
      expect(feature.getDeletedAt()).toBe(deletedAt);
      expect(feature.getIsEnabled()).toBe(isEnabled);
    });

    it("should throw InvalidFeatureUsageLimitError when maxUsage is zero", () => {
      // Arrange
      const featureName = faker.word.sample();

      // Act & Assert
      expect(() => {
        new Feature({ name: featureName, maxUsage: 0 });
      }).toThrow(InvalidFeatureUsageLimitError);
    });

    it("should throw InvalidFeatureUsageLimitError when maxUsage is negative", () => {
      // Arrange
      const featureName = faker.word.sample();
      const negativeMaxUsage = faker.number.int({ min: -100, max: -1 });

      // Act & Assert
      expect(() => {
        new Feature({ name: featureName, maxUsage: negativeMaxUsage });
      }).toThrow(InvalidFeatureUsageLimitError);
    });
  });

  describe("getters", () => {
    it("should return correct values", () => {
      // Arrange
      const id = faker.string.uuid();
      const name = faker.word.sample();
      const maxUsage = faker.number.int({ min: 1, max: 100 });
      const createdAt = new Date();
      const updatedAt = new Date();
      const deletedAt = null;
      const isEnabled = true;

      const feature = new Feature({
        id,
        name,
        maxUsage,
        createdAt,
        updatedAt,
        deletedAt,
        isEnabled,
      });

      // Act & Assert
      expect(feature.getId()).toBe(id);
      expect(feature.getName()).toBe(name);
      expect(feature.getMaxUsage()).toBe(maxUsage);
      expect(feature.getCreatedAt()).toBe(createdAt);
      expect(feature.getUpdatedAt()).toBe(updatedAt);
      expect(feature.getDeletedAt()).toBeNull();
      expect(feature.getIsEnabled()).toBe(isEnabled);
    });
  });

  describe("setters", () => {
    it("should update isEnabled", () => {
      // Arrange
      const feature = new Feature({ name: faker.word.sample() });
      const initialValue = feature.getIsEnabled();
      const newValue = !initialValue;

      // Act
      feature.setIsEnabled(newValue);

      // Assert
      expect(feature.getIsEnabled()).toBe(newValue);
      expect(feature.getIsEnabled()).not.toBe(initialValue);
    });

    it("should update name", () => {
      // Arrange
      const initialName = faker.word.sample();
      const feature = new Feature({ name: initialName });
      const newName = faker.word.sample();

      // Act
      feature.setName(newName);

      // Assert
      expect(feature.getName()).toBe(newName);
      expect(feature.getName()).not.toBe(initialName);
    });

    it("should update maxUsage", () => {
      // Arrange
      const feature = new Feature({ name: faker.word.sample() });
      const newMaxUsage = faker.number.int({ min: 1, max: 100 });

      // Act
      feature.setMaxUsage(newMaxUsage);

      // Assert
      expect(feature.getMaxUsage()).toBe(newMaxUsage);
    });

    it("should update maxUsage to null", () => {
      // Arrange
      const initialMaxUsage = faker.number.int({ min: 1, max: 100 });
      const feature = new Feature({
        name: faker.word.sample(),
        maxUsage: initialMaxUsage,
      });

      // Act
      feature.setMaxUsage(null);

      // Assert
      expect(feature.getMaxUsage()).toBeNull();
      expect(feature.isUnlimited()).toBe(true);
    });

    it("should throw InvalidFeatureUsageLimitError when setting maxUsage to zero", () => {
      // Arrange
      const feature = new Feature({ name: faker.word.sample() });

      // Act & Assert
      expect(() => {
        feature.setMaxUsage(0);
      }).toThrow(InvalidFeatureUsageLimitError);
      expect(feature.getMaxUsage()).toBeNull(); // Should not change
    });

    it("should throw InvalidFeatureUsageLimitError when setting maxUsage to negative value", () => {
      // Arrange
      const feature = new Feature({ name: faker.word.sample() });
      const negativeMaxUsage = faker.number.int({ min: -100, max: -1 });

      // Act & Assert
      expect(() => {
        feature.setMaxUsage(negativeMaxUsage);
      }).toThrow(InvalidFeatureUsageLimitError);
      expect(feature.getMaxUsage()).toBeNull(); // Should not change
    });

    it("should update updatedAt", () => {
      // Arrange
      const feature = new Feature({ name: faker.word.sample() });
      const initialUpdatedAt = feature.getUpdatedAt();
      const newUpdatedAt = new Date(initialUpdatedAt.getTime() + 1000); // 1 second later

      // Act
      feature.setUpdatedAt(newUpdatedAt);

      // Assert
      expect(feature.getUpdatedAt()).toBe(newUpdatedAt);
      expect(feature.getUpdatedAt()).not.toBe(initialUpdatedAt);
    });

    it("should update deletedAt", () => {
      // Arrange
      const feature = new Feature({ name: faker.word.sample() });
      const newDeletedAt = new Date();

      // Act
      feature.setDeletedAt(newDeletedAt);

      // Assert
      expect(feature.getDeletedAt()).toBe(newDeletedAt);
    });

    it("should update deletedAt to null", () => {
      // Arrange
      const initialDeletedAt = new Date();
      const feature = new Feature({
        name: faker.word.sample(),
        deletedAt: initialDeletedAt,
      });

      // Act
      feature.setDeletedAt(null);

      // Assert
      expect(feature.getDeletedAt()).toBeNull();
    });
  });

  describe("isUnlimited", () => {
    it("should return true when maxUsage is null", () => {
      // Arrange
      const feature = new Feature({
        name: faker.word.sample(),
        maxUsage: null,
      });

      // Act
      const result = feature.isUnlimited();

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when maxUsage is a number", () => {
      // Arrange
      const feature = new Feature({
        name: faker.word.sample(),
        maxUsage: faker.number.int({ min: 1, max: 100 }),
      });

      // Act
      const result = feature.isUnlimited();

      // Assert
      expect(result).toBe(false);
    });
  });
});
