import { faker } from "@faker-js/faker";
import { SubscriptionPlan } from "../subscription-plan";
import { Feature } from "../feature";

describe("SubscriptionPlan", () => {
  const createMockFeature = (): Feature => {
    return new Feature({
      name: faker.word.sample(),
      maxUsage: faker.number.int({ min: 1, max: 100 }),
    });
  };

  describe("constructor", () => {
    it("should create a subscription plan with default values", () => {
      // Arrange
      const name = faker.word.sample();
      const price = faker.number.float({ min: 1, max: 100 });
      const features = [createMockFeature(), createMockFeature()];

      // Act
      const subscriptionPlan = new SubscriptionPlan({ name, price, features });

      // Assert
      expect(subscriptionPlan.getId()).toBeTruthy();
      expect(subscriptionPlan.getName()).toBe(name);
      expect(subscriptionPlan.getPrice()).toBe(price);
      expect(subscriptionPlan.getFeatures()).toEqual(features);
      expect(subscriptionPlan.getCreatedAt()).toBeInstanceOf(Date);
      expect(subscriptionPlan.getUpdatedAt()).toBeInstanceOf(Date);
      expect(subscriptionPlan.getDeletedAt()).toBeNull();
      expect(subscriptionPlan.getIsActive()).toBe(true);
    });

    it("should create a subscription plan with custom values", () => {
      // Arrange
      const id = faker.string.uuid();
      const name = faker.word.sample();
      const price = faker.number.float({ min: 1, max: 100 });
      const features = [createMockFeature()];
      const createdAt = new Date(2023, 0, 1);
      const updatedAt = new Date(2023, 0, 2);
      const deletedAt = new Date(2023, 0, 3);
      const isActive = false;

      // Act
      const subscriptionPlan = new SubscriptionPlan({
        id,
        name,
        price,
        features,
        createdAt,
        updatedAt,
        deletedAt,
        isActive,
      });

      // Assert
      expect(subscriptionPlan.getId()).toBe(id);
      expect(subscriptionPlan.getName()).toBe(name);
      expect(subscriptionPlan.getPrice()).toBe(price);
      expect(subscriptionPlan.getFeatures()).toEqual(features);
      expect(subscriptionPlan.getCreatedAt()).toBe(createdAt);
      expect(subscriptionPlan.getUpdatedAt()).toBe(updatedAt);
      expect(subscriptionPlan.getDeletedAt()).toBe(deletedAt);
      expect(subscriptionPlan.getIsActive()).toBe(isActive);
    });
  });

  describe("setters", () => {
    it("should update the name", () => {
      // Arrange
      const subscriptionPlan = new SubscriptionPlan({
        name: faker.word.sample(),
        price: faker.number.float({ min: 1, max: 100 }),
        features: [createMockFeature()],
      });
      const newName = faker.word.sample();

      // Act
      subscriptionPlan.setName(newName);

      // Assert
      expect(subscriptionPlan.getName()).toBe(newName);
    });

    it("should update the price", () => {
      // Arrange
      const subscriptionPlan = new SubscriptionPlan({
        name: faker.word.sample(),
        price: faker.number.float({ min: 1, max: 100 }),
        features: [createMockFeature()],
      });
      const newPrice = faker.number.float({ min: 1, max: 100 });

      // Act
      subscriptionPlan.setPrice(newPrice);

      // Assert
      expect(subscriptionPlan.getPrice()).toBe(newPrice);
    });

    it("should update the features", () => {
      // Arrange
      const subscriptionPlan = new SubscriptionPlan({
        name: faker.word.sample(),
        price: faker.number.float({ min: 1, max: 100 }),
        features: [createMockFeature()],
      });
      const newFeatures = [createMockFeature(), createMockFeature()];

      // Act
      subscriptionPlan.setFeatures(newFeatures);

      // Assert
      expect(subscriptionPlan.getFeatures()).toEqual(newFeatures);
    });

    it("should update the deletedAt date", () => {
      // Arrange
      const subscriptionPlan = new SubscriptionPlan({
        name: faker.word.sample(),
        price: faker.number.float({ min: 1, max: 100 }),
        features: [createMockFeature()],
      });
      const deletedAt = new Date();

      // Act
      subscriptionPlan.setDeletedAt(deletedAt);

      // Assert
      expect(subscriptionPlan.getDeletedAt()).toBe(deletedAt);
    });

    it("should update the isActive status", () => {
      // Arrange
      const subscriptionPlan = new SubscriptionPlan({
        name: faker.word.sample(),
        price: faker.number.float({ min: 1, max: 100 }),
        features: [createMockFeature()],
      });
      const newIsActive = false;

      // Act
      subscriptionPlan.setIsActive(newIsActive);

      // Assert
      expect(subscriptionPlan.getIsActive()).toBe(newIsActive);
    });
  });
});
