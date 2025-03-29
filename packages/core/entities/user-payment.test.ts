import { faker } from "@faker-js/faker";
import { UserPayment } from "./user-payment";
import { SubscriptionPlan } from "./subscription-plan";

describe("UserPayment", () => {
  const createMockSubscriptionPlan = (): SubscriptionPlan => {
    return new SubscriptionPlan({
      name: faker.word.sample(),
      price: faker.number.float({ min: 1, max: 100 }),
      features: [],
    });
  };

  describe("constructor", () => {
    it("should create a user payment with default values", () => {
      // Arrange
      const userId = faker.string.uuid();
      const subscriptionPlan = createMockSubscriptionPlan();
      const amount = faker.number.float({ min: 10, max: 100 });
      const paymentDate = new Date();
      const paymentMethod = "Credit Card";

      // Act
      const userPayment = new UserPayment({
        userId,
        subscriptionPlan,
        amount,
        paymentDate,
        paymentMethod,
      });

      // Assert
      expect(userPayment.getId()).toBeTruthy();
      expect(userPayment.getUserId()).toBe(userId);
      expect(userPayment.getSubscriptionPlan()).toBe(subscriptionPlan);
      expect(userPayment.getAmount()).toBe(amount);
      expect(userPayment.getPaymentDate()).toBe(paymentDate);
      expect(userPayment.getPaymentMethod()).toBe(paymentMethod);
      expect(userPayment.getIsSuccessful()).toBe(true);
      expect(userPayment.getCreatedAt()).toBeInstanceOf(Date);
      expect(userPayment.getUpdatedAt()).toBeInstanceOf(Date);
      expect(userPayment.getDeletedAt()).toBeNull();
    });

    it("should create a user payment with custom values", () => {
      // Arrange
      const id = faker.string.uuid();
      const userId = faker.string.uuid();
      const subscriptionPlan = createMockSubscriptionPlan();
      const amount = faker.number.float({ min: 10, max: 100 });
      const paymentDate = new Date(2023, 0, 1);
      const paymentMethod = "PayPal";
      const isSuccessful = false;
      const createdAt = new Date(2023, 0, 1);
      const updatedAt = new Date(2023, 0, 2);
      const deletedAt = new Date(2023, 0, 3);

      // Act
      const userPayment = new UserPayment({
        id,
        userId,
        subscriptionPlan,
        amount,
        paymentDate,
        paymentMethod,
        isSuccessful,
        createdAt,
        updatedAt,
        deletedAt,
      });

      // Assert
      expect(userPayment.getId()).toBe(id);
      expect(userPayment.getUserId()).toBe(userId);
      expect(userPayment.getSubscriptionPlan()).toBe(subscriptionPlan);
      expect(userPayment.getAmount()).toBe(amount);
      expect(userPayment.getPaymentDate()).toBe(paymentDate);
      expect(userPayment.getPaymentMethod()).toBe(paymentMethod);
      expect(userPayment.getIsSuccessful()).toBe(isSuccessful);
      expect(userPayment.getCreatedAt()).toBe(createdAt);
      expect(userPayment.getUpdatedAt()).toBe(updatedAt);
      expect(userPayment.getDeletedAt()).toBe(deletedAt);
    });
  });

  describe("setters", () => {
    it("should update the deletedAt date", () => {
      // Arrange
      const userPayment = new UserPayment({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        amount: faker.number.float({ min: 10, max: 100 }),
        paymentDate: new Date(),
        paymentMethod: "Credit Card",
      });
      const deletedAt = new Date();

      // Act
      userPayment.setDeletedAt(deletedAt);

      // Assert
      expect(userPayment.getDeletedAt()).toBe(deletedAt);
    });

    it("should update the isSuccessful status", () => {
      // Arrange
      const userPayment = new UserPayment({
        userId: faker.string.uuid(),
        subscriptionPlan: createMockSubscriptionPlan(),
        amount: faker.number.float({ min: 10, max: 100 }),
        paymentDate: new Date(),
        paymentMethod: "Credit Card",
      });
      const isSuccessful = false;

      // Act
      userPayment.setIsSuccessful(isSuccessful);

      // Assert
      expect(userPayment.getIsSuccessful()).toBe(isSuccessful);
    });
  });
});
