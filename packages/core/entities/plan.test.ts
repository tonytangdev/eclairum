import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { Plan, BillingInterval } from "./plan";
import { RequiredFieldError } from "../errors/validation-errors";

describe("Plan", () => {
  // Helper function to create valid plan parameters
  const createValidPlanParams = () => ({
    name: faker.commerce.productName(),
    priceAmount: faker.number.int({ min: 500, max: 10000 }),
    billingInterval: BillingInterval.MONTHLY,
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
    it("should create a plan with minimum required properties", () => {
      // Arrange
      const params = createValidPlanParams();

      // Act
      const plan = new Plan(params);

      // Assert
      expect(plan).toBeInstanceOf(Plan);
      expect(plan.getName()).toBe(params.name);
      expect(plan.getPriceAmount()).toBe(params.priceAmount);
      expect(plan.getBillingInterval()).toBe(params.billingInterval);
      expect(plan.getId()).toEqual(expect.any(String));
      expect(plan.getCreatedAt()).toEqual(expect.any(Date));
      expect(plan.getUpdatedAt()).toEqual(expect.any(Date));
      expect(plan.getDeletedAt()).toBeNull();
      expect(plan.isCurrentlyActive()).toBe(true);
      expect(plan.isDeleted()).toBe(false);
      expect(plan.getTrialDays()).toBe(0);
      expect(plan.getPriceCurrency()).toBe("USD");
      expect(plan.getDescription()).toBeNull();
    });

    it("should create a plan with all custom properties", () => {
      // Arrange
      const id = randomUUID();
      const name = faker.commerce.productName();
      const description = faker.commerce.productDescription();
      const priceAmount = faker.number.int({ min: 500, max: 10000 });
      const priceCurrency = "EUR";
      const billingInterval = BillingInterval.YEARLY;
      const isActive = false;
      const trialDays = 14;
      const createdAt = new Date(2023, 1, 1);
      const updatedAt = new Date(2023, 1, 2);
      const deletedAt = new Date(2023, 1, 3);

      // Act
      const plan = new Plan({
        id,
        name,
        description,
        priceAmount,
        priceCurrency,
        billingInterval,
        isActive,
        trialDays,
        createdAt,
        updatedAt,
        deletedAt,
      });

      // Assert
      expect(plan.getId()).toBe(id);
      expect(plan.getName()).toBe(name);
      expect(plan.getDescription()).toBe(description);
      expect(plan.getPriceAmount()).toBe(priceAmount);
      expect(plan.getPriceCurrency()).toBe(priceCurrency.toUpperCase());
      expect(plan.getBillingInterval()).toBe(billingInterval);
      expect(plan.isCurrentlyActive()).toBe(false);
      expect(plan.getTrialDays()).toBe(trialDays);
      expect(plan.getCreatedAt()).toBe(createdAt);
      expect(plan.getUpdatedAt()).toBe(updatedAt);
      expect(plan.getDeletedAt()).toBe(deletedAt);
      expect(plan.isDeleted()).toBe(true);
    });

    it("should throw RequiredFieldError when name is empty", () => {
      // Arrange
      const params = { ...createValidPlanParams(), name: "" };

      // Act & Assert
      expect(() => new Plan(params)).toThrow(RequiredFieldError);
      expect(() => new Plan(params)).toThrow("name is required for Plan");
    });

    it("should throw an error when price amount is negative", () => {
      // Arrange
      const params = { ...createValidPlanParams(), priceAmount: -100 };

      // Act & Assert
      expect(() => new Plan(params)).toThrow("Price amount cannot be negative");
    });

    it("should throw an error when trial days is negative", () => {
      // Arrange
      const params = { ...createValidPlanParams(), trialDays: -5 };

      // Act & Assert
      expect(() => new Plan(params)).toThrow("Trial days cannot be negative");
    });

    it("should throw an error for invalid billing interval", () => {
      // Arrange
      const params = {
        ...createValidPlanParams(),
        billingInterval: "invalid-interval" as BillingInterval,
      };

      // Act & Assert
      expect(() => new Plan(params)).toThrow(
        "Invalid billing interval: invalid-interval",
      );
    });

    it("should convert price currency to uppercase", () => {
      // Arrange
      const params = { ...createValidPlanParams(), priceCurrency: "eur" };

      // Act
      const plan = new Plan(params);

      // Assert
      expect(plan.getPriceCurrency()).toBe("EUR");
    });
  });

  describe("getters", () => {
    it("should return formatted price with currency", () => {
      // Arrange
      const plan = new Plan({
        ...createValidPlanParams(),
        priceAmount: 1999,
        priceCurrency: "USD",
      });

      // Act & Assert
      expect(plan.getFormattedPrice()).toBe("19.99 USD");
    });

    it("should handle whole number prices correctly", () => {
      // Arrange
      const plan = new Plan({
        ...createValidPlanParams(),
        priceAmount: 2000,
        priceCurrency: "EUR",
      });

      // Act & Assert
      expect(plan.getFormattedPrice()).toBe("20.00 EUR");
    });
  });

  describe("setters and state changes", () => {
    it("should update name correctly", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());
      const originalUpdatedAt = plan.getUpdatedAt();
      const newName = faker.commerce.productName();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.setName(newName);

      // Assert
      expect(plan.getName()).toBe(newName);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should throw RequiredFieldError when setting empty name", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());

      // Act & Assert
      expect(() => plan.setName("")).toThrow(RequiredFieldError);
    });

    it("should update description correctly", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());
      const originalUpdatedAt = plan.getUpdatedAt();
      const newDescription = faker.commerce.productDescription();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.setDescription(newDescription);

      // Assert
      expect(plan.getDescription()).toBe(newDescription);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should update price amount correctly", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());
      const originalUpdatedAt = plan.getUpdatedAt();
      const newPriceAmount = 2999;

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.setPriceAmount(newPriceAmount);

      // Assert
      expect(plan.getPriceAmount()).toBe(newPriceAmount);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should throw error when setting negative price", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());

      // Act & Assert
      expect(() => plan.setPriceAmount(-500)).toThrow(
        "Price amount cannot be negative",
      );
    });

    it("should update billing interval correctly", () => {
      // Arrange
      const plan = new Plan({
        ...createValidPlanParams(),
        billingInterval: BillingInterval.MONTHLY,
      });
      const originalUpdatedAt = plan.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.setBillingInterval(BillingInterval.YEARLY);

      // Assert
      expect(plan.getBillingInterval()).toBe(BillingInterval.YEARLY);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should update trial days correctly", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());
      const originalUpdatedAt = plan.getUpdatedAt();
      const newTrialDays = 30;

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.setTrialDays(newTrialDays);

      // Assert
      expect(plan.getTrialDays()).toBe(newTrialDays);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should throw error when setting negative trial days", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());

      // Act & Assert
      expect(() => plan.setTrialDays(-5)).toThrow(
        "Trial days cannot be negative",
      );
    });
  });

  describe("activation and deactivation", () => {
    it("should deactivate an active plan", () => {
      // Arrange
      const plan = new Plan({
        ...createValidPlanParams(),
        isActive: true,
      });
      const originalUpdatedAt = plan.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.deactivate();

      // Assert
      expect(plan.isCurrentlyActive()).toBe(false);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should activate an inactive plan", () => {
      // Arrange
      const plan = new Plan({
        ...createValidPlanParams(),
        isActive: false,
      });
      const originalUpdatedAt = plan.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.activate();

      // Assert
      expect(plan.isCurrentlyActive()).toBe(true);
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe("soft delete and restore", () => {
    it("should soft delete a plan", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());
      const originalUpdatedAt = plan.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.softDelete();

      // Assert
      expect(plan.isDeleted()).toBe(true);
      expect(plan.getDeletedAt()).not.toBeNull();
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should restore a deleted plan", () => {
      // Arrange
      const plan = new Plan(createValidPlanParams());
      plan.softDelete();
      const deletedUpdatedAt = plan.getUpdatedAt();

      // Wait a small amount of time to ensure the timestamps are different
      jest.advanceTimersByTime(10);

      // Act
      plan.restore();

      // Assert
      expect(plan.isDeleted()).toBe(false);
      expect(plan.getDeletedAt()).toBeNull();
      expect(plan.getUpdatedAt().getTime()).toBeGreaterThan(
        deletedUpdatedAt.getTime(),
      );
    });

    it("should consider a deleted plan as inactive", () => {
      // Arrange
      const plan = new Plan({
        ...createValidPlanParams(),
        isActive: true,
      });

      // Act
      plan.softDelete();

      // Assert
      expect(plan.isCurrentlyActive()).toBe(false);
    });
  });
});
