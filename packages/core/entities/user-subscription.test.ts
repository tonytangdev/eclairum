import { faker } from "@faker-js/faker";
import { UserSubscription } from "./user-subscription";
import { SubscriptionPlan } from "./subscription-plan";

describe("UserSubscription", () => {
  const createMockSubscriptionPlan = (): SubscriptionPlan => {
    return new SubscriptionPlan({
      name: faker.word.sample(),
      price: faker.number.float({ min: 1, max: 100 }),
      features: [],
    });
  };

  describe("constructor", () => {
    it("should create a user subscription with default values", () => {
      // Arrange
      const userId = faker.string.uuid();
      const subscriptionPlan = createMockSubscriptionPlan();
      const startDate = new Date();

      // Act
      const userSubscription = new UserSubscription({
        userId,
        subscriptionPlan,
        startDate,
        endDate: null,
      });

      // Assert
      expect(userSubscription.getId()).toBeTruthy();
      expect(userSubscription.getUserId()).toBe(userId);
      expect(userSubscription.getSubscriptionPlan()).toBe(subscriptionPlan);
      expect(userSubscription.getStartDate()).toBe(startDate);
      expect(userSubscription.getEndDate()).toBeNull();
      expect(userSubscription.getIsActive()).toBe(true);
      expect(userSubscription.getCreatedAt()).toBeInstanceOf(Date);
      expect(userSubscription.getUpdatedAt()).toBeInstanceOf(Date);
      expect(userSubscription.getDeletedAt()).toBeNull();
    });

    it("should create a user subscription with default values when endDate is not defined", () => {
      // Arrange
      const userId = faker.string.uuid();
      const subscriptionPlan = createMockSubscriptionPlan();
      const startDate = new Date();

      // Act
      const userSubscription = new UserSubscription({
        userId,
        subscriptionPlan,
        startDate,
      });

      // Assert
      expect(userSubscription.getId()).toBeTruthy();
      expect(userSubscription.getUserId()).toBe(userId);
      expect(userSubscription.getSubscriptionPlan()).toBe(subscriptionPlan);
      expect(userSubscription.getStartDate()).toBe(startDate);
      expect(userSubscription.getEndDate()).toBeNull();
      expect(userSubscription.getIsActive()).toBe(true);
      expect(userSubscription.getCreatedAt()).toBeInstanceOf(Date);
      expect(userSubscription.getUpdatedAt()).toBeInstanceOf(Date);
      expect(userSubscription.getDeletedAt()).toBeNull();
    });

    it("should create a user subscription with custom values", () => {
      // Arrange
      const id = faker.string.uuid();
      const userId = faker.string.uuid();
      const subscriptionPlan = createMockSubscriptionPlan();
      const startDate = new Date(2023, 0, 1);
      const endDate = new Date(2023, 11, 31);
      const isActive = false;
      const createdAt = new Date(2023, 0, 1);
      const updatedAt = new Date(2023, 0, 2);
      const deletedAt = new Date(2023, 0, 3);

      // Act
      const userSubscription = new UserSubscription({
        id,
        userId,
        subscriptionPlan,
        startDate,
        endDate,
        isActive,
        createdAt,
        updatedAt,
        deletedAt,
      });

      // Assert
      expect(userSubscription.getId()).toBe(id);
      expect(userSubscription.getUserId()).toBe(userId);
      expect(userSubscription.getSubscriptionPlan()).toBe(subscriptionPlan);
      expect(userSubscription.getStartDate()).toBe(startDate);
      expect(userSubscription.getEndDate()).toBe(endDate);
      expect(userSubscription.getIsActive()).toBe(isActive);
      expect(userSubscription.getCreatedAt()).toBe(createdAt);
      expect(userSubscription.getUpdatedAt()).toBe(updatedAt);
      expect(userSubscription.getDeletedAt()).toBe(deletedAt);
    });
  });

  describe("setters", () => {
    it("should update the subscription plan", () => {
      // Arrange
      const userSubscription = new UserSubscription({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        startDate: new Date(),
      });
      const newSubscriptionPlan = createMockSubscriptionPlan();

      // Act
      userSubscription.setSubscriptionPlan(newSubscriptionPlan);

      // Assert
      expect(userSubscription.getSubscriptionPlan()).toBe(newSubscriptionPlan);
    });

    it("should update the start date", () => {
      // Arrange
      const userSubscription = new UserSubscription({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        startDate: new Date(),
      });
      const newStartDate = new Date();

      // Act
      userSubscription.setStartDate(newStartDate);

      // Assert
      expect(userSubscription.getStartDate()).toBe(newStartDate);
    });

    it("should update the end date", () => {
      // Arrange
      const userSubscription = new UserSubscription({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        startDate: new Date(),
      });
      const newEndDate = new Date();

      // Act
      userSubscription.setEndDate(newEndDate);

      // Assert
      expect(userSubscription.getEndDate()).toBe(newEndDate);
    });

    it("should update the isActive status", () => {
      // Arrange
      const userSubscription = new UserSubscription({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        startDate: new Date(),
      });
      const newIsActive = false;

      // Act
      userSubscription.setIsActive(newIsActive);

      // Assert
      expect(userSubscription.getIsActive()).toBe(newIsActive);
    });

    it("should update the deletedAt date", () => {
      // Arrange
      const userSubscription = new UserSubscription({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        startDate: new Date(),
      });
      const newDeletedAt = new Date();

      // Act
      userSubscription.setDeletedAt(newDeletedAt);

      // Assert
      expect(userSubscription.getDeletedAt()).toBe(newDeletedAt);
    });
  });
});
