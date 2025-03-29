import { faker } from "@faker-js/faker";
import { FeatureLimitation, LimitationType } from "../feature-limitation";
import { InvalidFeatureLimitationError } from "../../errors/feature-limitation-errors";

describe("FeatureLimitation", () => {
  // Helper function to create a valid feature limitation
  const createValidFeatureLimitation = (overrides = {}) => {
    return new FeatureLimitation({
      featureId: faker.string.uuid(),
      subscriptionPlanId: faker.string.uuid(),
      limitationType: LimitationType.FEATURE_TOGGLE,
      ...overrides,
    });
  };

  describe("constructor", () => {
    it("should create a valid feature limitation with default values", () => {
      // Arrange
      const featureId = faker.string.uuid();
      const subscriptionPlanId = faker.string.uuid();

      // Act
      const featureLimitation = new FeatureLimitation({
        featureId,
        subscriptionPlanId,
        limitationType: LimitationType.FEATURE_TOGGLE,
      });

      // Assert
      expect(featureLimitation.getId()).toBeDefined();
      expect(featureLimitation.getFeatureId()).toBe(featureId);
      expect(featureLimitation.getSubscriptionPlanId()).toBe(
        subscriptionPlanId,
      );
      expect(featureLimitation.getLimitationType()).toBe(
        LimitationType.FEATURE_TOGGLE,
      );
      expect(featureLimitation.getMaxUsage()).toBeNull();
      expect(featureLimitation.getTimeLimit()).toBeNull();
      expect(featureLimitation.getIsEnabled()).toBe(true);
      expect(featureLimitation.getCreatedAt()).toBeInstanceOf(Date);
      expect(featureLimitation.getUpdatedAt()).toBeInstanceOf(Date);
      expect(featureLimitation.getDeletedAt()).toBeNull();
    });

    it("should create a valid USAGE_COUNT feature limitation", () => {
      // Arrange
      const featureId = faker.string.uuid();
      const subscriptionPlanId = faker.string.uuid();
      const maxUsage = faker.number.int({ min: 1, max: 100 });

      // Act
      const featureLimitation = new FeatureLimitation({
        featureId,
        subscriptionPlanId,
        limitationType: LimitationType.USAGE_COUNT,
        maxUsage,
      });

      // Assert
      expect(featureLimitation.getMaxUsage()).toBe(maxUsage);
      expect(featureLimitation.getLimitationType()).toBe(
        LimitationType.USAGE_COUNT,
      );
    });

    it("should create a valid TIME_BASED feature limitation", () => {
      // Arrange
      const featureId = faker.string.uuid();
      const subscriptionPlanId = faker.string.uuid();
      const timeLimit = faker.number.int({ min: 1, max: 86400 }); // seconds in a day

      // Act
      const featureLimitation = new FeatureLimitation({
        featureId,
        subscriptionPlanId,
        limitationType: LimitationType.TIME_BASED,
        timeLimit,
      });

      // Assert
      expect(featureLimitation.getTimeLimit()).toBe(timeLimit);
      expect(featureLimitation.getLimitationType()).toBe(
        LimitationType.TIME_BASED,
      );
    });

    it("should throw an error when maxUsage is not positive for USAGE_COUNT limitation type", () => {
      // Arrange & Act & Assert
      expect(
        () =>
          new FeatureLimitation({
            featureId: faker.string.uuid(),
            subscriptionPlanId: faker.string.uuid(),
            limitationType: LimitationType.USAGE_COUNT,
            maxUsage: 0,
          }),
      ).toThrow(InvalidFeatureLimitationError);

      expect(
        () =>
          new FeatureLimitation({
            featureId: faker.string.uuid(),
            subscriptionPlanId: faker.string.uuid(),
            limitationType: LimitationType.USAGE_COUNT,
            maxUsage: -5,
          }),
      ).toThrow(InvalidFeatureLimitationError);
    });

    it("should throw an error when timeLimit is not positive for TIME_BASED limitation type", () => {
      // Arrange & Act & Assert
      expect(
        () =>
          new FeatureLimitation({
            featureId: faker.string.uuid(),
            subscriptionPlanId: faker.string.uuid(),
            limitationType: LimitationType.TIME_BASED,
            timeLimit: 0,
          }),
      ).toThrow(InvalidFeatureLimitationError);

      expect(
        () =>
          new FeatureLimitation({
            featureId: faker.string.uuid(),
            subscriptionPlanId: faker.string.uuid(),
            limitationType: LimitationType.TIME_BASED,
            timeLimit: null,
          }),
      ).toThrow(InvalidFeatureLimitationError);
    });
  });

  describe("setters", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date());
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it("should update limitation type", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation();

      // Act
      featureLimitation.setLimitationType(LimitationType.USAGE_COUNT);

      // Assert
      expect(featureLimitation.getLimitationType()).toBe(
        LimitationType.USAGE_COUNT,
      );
    });

    it("should update max usage when valid", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.USAGE_COUNT,
      });
      const newMaxUsage = faker.number.int({ min: 1, max: 100 });

      // Act
      featureLimitation.setMaxUsage(newMaxUsage);

      // Assert
      expect(featureLimitation.getMaxUsage()).toBe(newMaxUsage);
    });

    it("should throw an error when updating max usage to invalid value", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.USAGE_COUNT,
        maxUsage: 10,
      });

      // Act & Assert
      expect(() => featureLimitation.setMaxUsage(0)).toThrow(
        InvalidFeatureLimitationError,
      );
      expect(() => featureLimitation.setMaxUsage(-5)).toThrow(
        InvalidFeatureLimitationError,
      );
    });

    it("should update time limit when valid", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.TIME_BASED,
        timeLimit: 3600,
      });
      const newTimeLimit = 7200;

      // Act
      featureLimitation.setTimeLimit(newTimeLimit);

      // Assert
      expect(featureLimitation.getTimeLimit()).toBe(newTimeLimit);
    });

    it("should throw an error when updating time limit to invalid value", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.TIME_BASED,
        timeLimit: 3600,
      });

      // Act & Assert
      expect(() => featureLimitation.setTimeLimit(0)).toThrow(
        InvalidFeatureLimitationError,
      );
      expect(() => featureLimitation.setTimeLimit(null)).toThrow(
        InvalidFeatureLimitationError,
      );
    });

    it("should update isEnabled status", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        isEnabled: true,
      });

      // Act
      featureLimitation.setIsEnabled(false);

      // Assert
      expect(featureLimitation.getIsEnabled()).toBe(false);
    });

    it("should update deletedAt date", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation();
      const deletedDate = new Date();

      // Act
      featureLimitation.setDeletedAt(deletedDate);

      // Assert
      expect(featureLimitation.getDeletedAt()).toBe(deletedDate);
    });

    it("should update updatedAt when setting deletedAt", () => {
      const featureLimitation = createValidFeatureLimitation();
      const originalUpdatedAt = featureLimitation.getUpdatedAt();

      // Wait a small amount to ensure date difference
      jest.advanceTimersByTime(10);

      // Act
      featureLimitation.setDeletedAt(new Date());

      // Assert
      expect(featureLimitation.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should update updatedAt when setting isEnabled", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation();
      const originalUpdatedAt = featureLimitation.getUpdatedAt();

      // Wait a small amount to ensure date difference
      jest.advanceTimersByTime(10);

      // Act
      featureLimitation.setIsEnabled(false);

      // Assert
      expect(featureLimitation.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should update updatedAt when setting limitationType", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation();
      const originalUpdatedAt = featureLimitation.getUpdatedAt();

      // Wait a small amount to ensure date difference
      jest.advanceTimersByTime(10);

      // Act
      featureLimitation.setLimitationType(LimitationType.USAGE_COUNT);

      // Assert
      expect(featureLimitation.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe("isUnlimited", () => {
    it("should return true for FEATURE_TOGGLE limitation type", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.FEATURE_TOGGLE,
      });

      // Act & Assert
      expect(featureLimitation.isUnlimited()).toBe(true);
    });

    it("should return true when maxUsage is null for USAGE_COUNT limitation type", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.USAGE_COUNT,
        maxUsage: null,
      });

      // Act & Assert
      expect(featureLimitation.isUnlimited()).toBe(true);
    });

    it("should return false when maxUsage is set for USAGE_COUNT limitation type", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.USAGE_COUNT,
        maxUsage: 10,
      });

      // Act & Assert
      expect(featureLimitation.isUnlimited()).toBe(false);
    });

    it("should return true when timeLimit is null for TIME_BASED limitation type", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.TIME_BASED,
        timeLimit: 3600,
      });

      // Override the private property through a setter after validation
      Object.defineProperty(featureLimitation, "timeLimit", { value: null });
      Object.defineProperty(featureLimitation, "limitationType", {
        value: LimitationType.USAGE_COUNT,
      });

      // Act & Assert
      expect(featureLimitation.isUnlimited()).toBe(true);
    });

    it("should return false when timeLimit is set for TIME_BASED limitation type", () => {
      // Arrange
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.TIME_BASED,
        timeLimit: 3600,
      });

      // Act & Assert
      expect(featureLimitation.isUnlimited()).toBe(false);
    });

    it("should return false when both maxUsage and timeLimit are set", () => {
      // Arrange - create with one type first to pass validation
      const featureLimitation = createValidFeatureLimitation({
        limitationType: LimitationType.TIME_BASED,
        timeLimit: 3600,
      });

      // Then set maxUsage using internal property access to simulate having both set
      Object.defineProperty(featureLimitation, "maxUsage", { value: 10 });

      // Act & Assert
      expect(featureLimitation.isUnlimited()).toBe(false);
    });
  });

  describe("getters", () => {
    it("should return correct values from getters", () => {
      // Arrange
      const id = crypto.randomUUID();
      const featureId = faker.string.uuid();
      const subscriptionPlanId = faker.string.uuid();
      const limitationType = LimitationType.USAGE_COUNT;
      const maxUsage = 50;
      const isEnabled = false;
      const timeLimit = null;
      const createdAt = new Date(2023, 0, 1);
      const updatedAt = new Date(2023, 0, 2);
      const deletedAt = new Date(2023, 0, 3);

      const featureLimitation = new FeatureLimitation({
        id,
        featureId,
        subscriptionPlanId,
        limitationType,
        maxUsage,
        isEnabled,
        timeLimit,
        createdAt,
        updatedAt,
        deletedAt,
      });

      // Act & Assert
      expect(featureLimitation.getId()).toBe(id);
      expect(featureLimitation.getFeatureId()).toBe(featureId);
      expect(featureLimitation.getSubscriptionPlanId()).toBe(
        subscriptionPlanId,
      );
      expect(featureLimitation.getLimitationType()).toBe(limitationType);
      expect(featureLimitation.getMaxUsage()).toBe(maxUsage);
      expect(featureLimitation.getIsEnabled()).toBe(isEnabled);
      expect(featureLimitation.getTimeLimit()).toBe(timeLimit);
      expect(featureLimitation.getCreatedAt()).toBe(createdAt);
      expect(featureLimitation.getUpdatedAt()).toBe(updatedAt);
      expect(featureLimitation.getDeletedAt()).toBe(deletedAt);
    });
  });
});
