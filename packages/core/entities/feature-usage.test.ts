import { faker } from "@faker-js/faker";
import { FeatureUsage } from "./feature-usage";
import { RequiredFieldError } from "../errors/validation-errors";
import {
  InvalidResetDateError,
  InvalidUsageAmountError,
  NegativeLimitError,
  NegativeUsageCountError,
} from "../errors/feature-usage-errors";

describe("FeatureUsage", () => {
  // Helper function to create valid feature usage parameters with faker data
  const createValidFeatureUsageParams = () => ({
    userId: faker.string.uuid(),
    featureId: faker.string.uuid(),
    resetAt: faker.date.future(),
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a feature usage with minimum required properties", () => {
      // Arrange
      const params = createValidFeatureUsageParams();

      // Act
      const featureUsage = new FeatureUsage(params);

      // Assert
      expect(featureUsage).toBeInstanceOf(FeatureUsage);
      expect(featureUsage.getUserId()).toBe(params.userId);
      expect(featureUsage.getFeatureId()).toBe(params.featureId);
      expect(featureUsage.getUsageCount()).toBe(0);
      expect(featureUsage.getResetAt()).toBe(params.resetAt);
      expect(featureUsage.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(featureUsage.getCreatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
      expect(featureUsage.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should create a feature usage with all custom properties", () => {
      // Arrange
      const id = faker.string.uuid();
      const userId = faker.string.uuid();
      const featureId = faker.string.uuid();
      const usageCount = faker.number.int({ min: 1, max: 100 });
      const resetAt = new Date("2024-02-01");
      const createdAt = new Date("2023-12-01");
      const updatedAt = new Date("2023-12-15");

      // Act
      const featureUsage = new FeatureUsage({
        id,
        userId,
        featureId,
        usageCount,
        resetAt,
        createdAt,
        updatedAt,
      });

      // Assert
      expect(featureUsage.getId()).toBe(id);
      expect(featureUsage.getUserId()).toBe(userId);
      expect(featureUsage.getFeatureId()).toBe(featureId);
      expect(featureUsage.getUsageCount()).toBe(usageCount);
      expect(featureUsage.getResetAt()).toBe(resetAt);
      expect(featureUsage.getCreatedAt()).toBe(createdAt);
      expect(featureUsage.getUpdatedAt()).toBe(updatedAt);
    });

    it("should throw RequiredFieldError when userId is empty", () => {
      // Arrange
      const params = {
        ...createValidFeatureUsageParams(),
        userId: "   ",
      };

      // Act & Assert
      expect(() => new FeatureUsage(params)).toThrow(RequiredFieldError);
      expect(() => new FeatureUsage(params)).toThrow(
        "userId is required for FeatureUsage",
      );
    });

    it("should throw RequiredFieldError when featureId is empty", () => {
      // Arrange
      const params = {
        ...createValidFeatureUsageParams(),
        featureId: "",
      };

      // Act & Assert
      expect(() => new FeatureUsage(params)).toThrow(RequiredFieldError);
      expect(() => new FeatureUsage(params)).toThrow(
        "featureId is required for FeatureUsage",
      );
    });

    it("should throw Error when usageCount is negative", () => {
      // Arrange
      const params = {
        ...createValidFeatureUsageParams(),
        usageCount: -5,
      };

      // Act & Assert
      expect(() => new FeatureUsage(params)).toThrow(NegativeUsageCountError);
      expect(() => new FeatureUsage(params)).toThrow(
        "Usage count cannot be negative",
      );
    });

    it("should throw RequiredFieldError when resetAt is not provided", () => {
      // Arrange
      const params = {
        ...createValidFeatureUsageParams(),
        resetAt: undefined as unknown as Date,
      };

      // Act & Assert
      expect(() => new FeatureUsage(params)).toThrow(RequiredFieldError);
      expect(() => new FeatureUsage(params)).toThrow(
        "resetAt is required for FeatureUsage",
      );
    });
  });

  describe("incrementUsage", () => {
    it("should increment usage count by 1 by default", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 5,
      });
      const previousUpdatedAt = featureUsage.getUpdatedAt();

      // Act
      featureUsage.incrementUsage();

      // Assert
      expect(featureUsage.getUsageCount()).toBe(6);
      expect(featureUsage.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(featureUsage.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should increment usage count by specified amount", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 10,
      });

      // Act
      featureUsage.incrementUsage(5);

      // Assert
      expect(featureUsage.getUsageCount()).toBe(15);
    });

    it("should throw Error when increment amount is not positive", () => {
      // Arrange
      const featureUsage = new FeatureUsage(createValidFeatureUsageParams());

      // Act & Assert
      expect(() => featureUsage.incrementUsage(0)).toThrow(
        InvalidUsageAmountError,
      );
      expect(() => featureUsage.incrementUsage(0)).toThrow(
        "Increment amount must be positive",
      );
      expect(() => featureUsage.incrementUsage(-1)).toThrow(
        InvalidUsageAmountError,
      );
      expect(() => featureUsage.incrementUsage(-1)).toThrow(
        "Increment amount must be positive",
      );
    });
  });

  describe("decrementUsage", () => {
    it("should decrement usage count by 1 by default", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 5,
      });
      const previousUpdatedAt = featureUsage.getUpdatedAt();

      // Act
      featureUsage.decrementUsage();

      // Assert
      expect(featureUsage.getUsageCount()).toBe(4);
      expect(featureUsage.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(featureUsage.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should decrement usage count by specified amount", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 10,
      });

      // Act
      featureUsage.decrementUsage(3);

      // Assert
      expect(featureUsage.getUsageCount()).toBe(7);
    });

    it("should not allow usage count to go below zero", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 5,
      });

      // Act
      featureUsage.decrementUsage(10);

      // Assert
      expect(featureUsage.getUsageCount()).toBe(0);
    });

    it("should throw Error when decrement amount is not positive", () => {
      // Arrange
      const featureUsage = new FeatureUsage(createValidFeatureUsageParams());

      // Act & Assert
      expect(() => featureUsage.decrementUsage(0)).toThrow(
        InvalidUsageAmountError,
      );
      expect(() => featureUsage.decrementUsage(0)).toThrow(
        "Decrement amount must be positive",
      );
      expect(() => featureUsage.decrementUsage(-1)).toThrow(
        InvalidUsageAmountError,
      );
      expect(() => featureUsage.decrementUsage(-1)).toThrow(
        "Decrement amount must be positive",
      );
    });
  });

  describe("resetUsage", () => {
    it("should reset usage count to zero", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 25,
      });
      const previousUpdatedAt = featureUsage.getUpdatedAt();

      // Act
      featureUsage.resetUsage();

      // Assert
      expect(featureUsage.getUsageCount()).toBe(0);
      expect(featureUsage.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(featureUsage.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });
  });

  describe("updateResetDate", () => {
    it("should update reset date", () => {
      // Arrange
      const featureUsage = new FeatureUsage(createValidFeatureUsageParams());
      const newResetDate = new Date("2024-03-01");
      const previousUpdatedAt = featureUsage.getUpdatedAt();

      // Act
      featureUsage.updateResetDate(newResetDate);

      // Assert
      expect(featureUsage.getResetAt()).toBe(newResetDate);
      expect(featureUsage.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(featureUsage.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should throw Error when reset date is null or undefined", () => {
      // Arrange
      const featureUsage = new FeatureUsage(createValidFeatureUsageParams());

      // Act & Assert
      expect(() =>
        featureUsage.updateResetDate(null as unknown as Date),
      ).toThrow(InvalidResetDateError);
      expect(() =>
        featureUsage.updateResetDate(null as unknown as Date),
      ).toThrow("Reset date cannot be null or undefined");
      expect(() =>
        featureUsage.updateResetDate(undefined as unknown as Date),
      ).toThrow(InvalidResetDateError);
      expect(() =>
        featureUsage.updateResetDate(undefined as unknown as Date),
      ).toThrow("Reset date cannot be null or undefined");
    });
  });

  describe("isExpired", () => {
    it("should return true when current date is after reset date", () => {
      // Arrange - Set current date to 2024-01-01
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        resetAt: new Date("2023-12-31"),
      });

      // Act & Assert
      expect(featureUsage.isExpired()).toBe(true);
    });

    it("should return true when current date is exactly at reset date", () => {
      // Arrange - Set current date to 2024-01-01
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        resetAt: new Date("2024-01-01T12:00:00Z"),
      });

      // Act & Assert
      expect(featureUsage.isExpired()).toBe(true);
    });

    it("should return false when current date is before reset date", () => {
      // Arrange - Set current date to 2024-01-01
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        resetAt: new Date("2024-01-02"),
      });

      // Act & Assert
      expect(featureUsage.isExpired()).toBe(false);
    });
  });

  describe("isWithinLimit", () => {
    it("should return true when usage count is less than limit", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 8,
      });

      // Act & Assert
      expect(featureUsage.isWithinLimit(10)).toBe(true);
    });

    it("should return false when usage count equals limit", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 10,
      });

      // Act & Assert
      expect(featureUsage.isWithinLimit(10)).toBe(false);
    });

    it("should return false when usage count exceeds limit", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 15,
      });

      // Act & Assert
      expect(featureUsage.isWithinLimit(10)).toBe(false);
    });
  });

  describe("getRemainingUsage", () => {
    it("should return remaining usage when under limit", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 3,
      });

      // Act & Assert
      expect(featureUsage.getRemainingUsage(10)).toBe(7);
    });

    it("should return zero when at limit", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 10,
      });

      // Act & Assert
      expect(featureUsage.getRemainingUsage(10)).toBe(0);
    });

    it("should return zero when over limit", () => {
      // Arrange
      const featureUsage = new FeatureUsage({
        ...createValidFeatureUsageParams(),
        usageCount: 12,
      });

      // Act & Assert
      expect(featureUsage.getRemainingUsage(10)).toBe(0);
    });

    it("should throw Error when limit is negative", () => {
      // Arrange
      const featureUsage = new FeatureUsage(createValidFeatureUsageParams());

      // Act & Assert
      expect(() => featureUsage.getRemainingUsage(-5)).toThrow(
        NegativeLimitError,
      );
      expect(() => featureUsage.getRemainingUsage(-5)).toThrow(
        "Limit cannot be negative",
      );
    });
  });
});
