import { faker } from "@faker-js/faker";
import { Subscription, SubscriptionStatus } from "./subscription";
import { RequiredFieldError } from "../errors/validation-errors";

describe("Subscription", () => {
  // Helper function to create valid subscription parameters with faker data
  const createValidSubscriptionParams = () => {
    const startDate = faker.date.recent();
    const endDate = faker.date.future({ refDate: startDate });

    return {
      userId: faker.string.uuid(),
      planId: faker.string.uuid(),
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a subscription with minimum required properties", () => {
      // Arrange
      const params = createValidSubscriptionParams();

      // Act
      const subscription = new Subscription(params);

      // Assert
      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.getUserId()).toBe(params.userId);
      expect(subscription.getPlanId()).toBe(params.planId);
      expect(subscription.getStatus()).toBe(params.status);
      expect(subscription.getCurrentPeriodStart()).toBe(
        params.currentPeriodStart,
      );
      expect(subscription.getCurrentPeriodEnd()).toBe(params.currentPeriodEnd);
      expect(subscription.willCancelAtPeriodEnd()).toBe(false);
      expect(subscription.getTrialStart()).toBeNull();
      expect(subscription.getTrialEnd()).toBeNull();
      expect(subscription.getCanceledAt()).toBeNull();
      expect(subscription.getPaymentProvider()).toBeNull();
      expect(subscription.getProviderSubscriptionId()).toBeNull();
      expect(subscription.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(subscription.getCreatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should create a subscription with all custom properties", () => {
      // Arrange
      const id = faker.string.uuid();
      const userId = faker.string.uuid();
      const planId = faker.string.uuid();
      const status = SubscriptionStatus.TRIALING;
      const currentPeriodStart = new Date("2023-01-01");
      const currentPeriodEnd = new Date("2023-02-01");
      const cancelAtPeriodEnd = true;
      const trialStart = new Date("2023-01-01");
      const trialEnd = new Date("2023-01-15");
      const canceledAt = null;
      const paymentProvider = "stripe";
      const providerSubscriptionId = faker.string.alphanumeric(10);
      const createdAt = new Date("2023-01-01");
      const updatedAt = new Date("2023-01-02");

      // Act
      const subscription = new Subscription({
        id,
        userId,
        planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        trialStart,
        trialEnd,
        canceledAt,
        paymentProvider,
        providerSubscriptionId,
        createdAt,
        updatedAt,
      });

      // Assert
      expect(subscription.getId()).toBe(id);
      expect(subscription.getUserId()).toBe(userId);
      expect(subscription.getPlanId()).toBe(planId);
      expect(subscription.getStatus()).toBe(status);
      expect(subscription.getCurrentPeriodStart()).toEqual(currentPeriodStart);
      expect(subscription.getCurrentPeriodEnd()).toEqual(currentPeriodEnd);
      expect(subscription.willCancelAtPeriodEnd()).toBe(cancelAtPeriodEnd);
      expect(subscription.getTrialStart()).toEqual(trialStart);
      expect(subscription.getTrialEnd()).toEqual(trialEnd);
      expect(subscription.getCanceledAt()).toBe(canceledAt);
      expect(subscription.getPaymentProvider()).toBe(paymentProvider);
      expect(subscription.getProviderSubscriptionId()).toBe(
        providerSubscriptionId,
      );
      expect(subscription.getCreatedAt()).toEqual(createdAt);
      expect(subscription.getUpdatedAt()).toEqual(updatedAt);
    });

    it("should throw RequiredFieldError when userId is empty", () => {
      // Arrange
      const params = {
        ...createValidSubscriptionParams(),
        userId: "   ",
      };

      // Act & Assert
      expect(() => new Subscription(params)).toThrow(RequiredFieldError);
      expect(() => new Subscription(params)).toThrow(
        "userId is required for Subscription",
      );
    });

    it("should throw RequiredFieldError when planId is empty", () => {
      // Arrange
      const params = {
        ...createValidSubscriptionParams(),
        planId: "",
      };

      // Act & Assert
      expect(() => new Subscription(params)).toThrow(RequiredFieldError);
      expect(() => new Subscription(params)).toThrow(
        "planId is required for Subscription",
      );
    });

    it("should throw Error when status is invalid", () => {
      // Arrange
      const params = createValidSubscriptionParams();
      const invalidStatus = "invalid_status" as SubscriptionStatus;

      // Act & Assert
      expect(
        () =>
          new Subscription({
            ...params,
            status: invalidStatus,
          }),
      ).toThrow(`Invalid subscription status: ${invalidStatus}`);
    });

    it("should throw Error when currentPeriodEnd is before currentPeriodStart", () => {
      // Arrange
      const currentPeriodStart = faker.date.future();
      const currentPeriodEnd = faker.date.recent({
        refDate: currentPeriodStart,
      });
      const params = {
        ...createValidSubscriptionParams(),
        currentPeriodStart,
        currentPeriodEnd,
      };

      // Act & Assert
      expect(() => new Subscription(params)).toThrow(
        "Current period end must be after current period start",
      );
    });

    it("should throw Error when trialEnd is before trialStart", () => {
      // Arrange
      const trialStart = faker.date.future();
      const trialEnd = faker.date.recent({ refDate: trialStart });
      const params = {
        ...createValidSubscriptionParams(),
        trialStart,
        trialEnd,
      };

      // Act & Assert
      expect(() => new Subscription(params)).toThrow(
        "Trial end must be after trial start",
      );
    });
  });

  describe("updateStatus", () => {
    it("should update the status and set updated date to current time", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const newStatus = SubscriptionStatus.PAST_DUE;
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.updateStatus(newStatus);

      // Assert
      expect(subscription.getStatus()).toBe(newStatus);
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should throw Error when status is invalid", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const invalidStatus = "invalid_status" as SubscriptionStatus;

      // Act & Assert
      expect(() => subscription.updateStatus(invalidStatus)).toThrow(
        `Invalid subscription status: ${invalidStatus}`,
      );
    });
  });

  describe("setPlanId", () => {
    it("should set planId and update timestamp", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const newPlanId = faker.string.uuid();
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.setPlanId(newPlanId);

      // Assert
      expect(subscription.getPlanId()).toBe(newPlanId);
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should throw RequiredFieldError when planId is empty", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());

      // Act & Assert
      expect(() => subscription.setPlanId("  ")).toThrow(RequiredFieldError);
      expect(() => subscription.setPlanId("  ")).toThrow(
        "planId is required for Subscription",
      );
    });
  });

  describe("updateCurrentPeriod", () => {
    it("should update current period dates and update timestamp", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const newStart = new Date("2024-04-01");
      const newEnd = new Date("2024-05-01");
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.updateCurrentPeriod(newStart, newEnd);

      // Assert
      expect(subscription.getCurrentPeriodStart()).toEqual(newStart);
      expect(subscription.getCurrentPeriodEnd()).toEqual(newEnd);
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should throw Error when end is before start", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const newStart = new Date("2024-05-01");
      const newEnd = new Date("2024-04-01");

      // Act & Assert
      expect(() => subscription.updateCurrentPeriod(newStart, newEnd)).toThrow(
        "Current period end must be after current period start",
      );
    });
  });

  describe("setCancelAtPeriodEnd", () => {
    it("should set cancelAtPeriodEnd and update timestamp", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.setCancelAtPeriodEnd(true);

      // Assert
      expect(subscription.willCancelAtPeriodEnd()).toBe(true);
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });
  });

  describe("setTrialPeriod", () => {
    it("should update trial period dates and update timestamp", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const trialStart = new Date("2024-01-15");
      const trialEnd = new Date("2024-01-30");
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.setTrialPeriod(trialStart, trialEnd);

      // Assert
      expect(subscription.getTrialStart()).toEqual(trialStart);
      expect(subscription.getTrialEnd()).toEqual(trialEnd);
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should allow setting trial period to null", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart: new Date("2024-01-01"),
        trialEnd: new Date("2024-01-15"),
      });
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.setTrialPeriod(null, null);

      // Assert
      expect(subscription.getTrialStart()).toBeNull();
      expect(subscription.getTrialEnd()).toBeNull();
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should throw Error when trialEnd is before trialStart", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const trialStart = new Date("2024-01-30");
      const trialEnd = new Date("2024-01-15");

      // Act & Assert
      expect(() => subscription.setTrialPeriod(trialStart, trialEnd)).toThrow(
        "Trial end must be after trial start",
      );
    });
  });

  describe("cancel", () => {
    it("should cancel the subscription by updating status, canceledAt and updatedAt", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        status: SubscriptionStatus.ACTIVE,
      });
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.cancel();

      // Assert
      expect(subscription.getStatus()).toBe(SubscriptionStatus.CANCELED);
      expect(subscription.getCanceledAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });
  });

  describe("setPaymentProvider", () => {
    it("should update payment provider information and update timestamp", () => {
      // Arrange
      const subscription = new Subscription(createValidSubscriptionParams());
      const provider = faker.helpers.arrayElement([
        "stripe",
        "paypal",
        "braintree",
      ]);
      const providerId = faker.string.alphanumeric(15);
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.setPaymentProvider(provider, providerId);

      // Assert
      expect(subscription.getPaymentProvider()).toBe(provider);
      expect(subscription.getProviderSubscriptionId()).toBe(providerId);
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });

    it("should allow setting payment provider info to null", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        paymentProvider: "stripe",
        providerSubscriptionId: faker.string.alphanumeric(10),
      });
      const previousUpdatedAt = subscription.getUpdatedAt();

      // Act
      subscription.setPaymentProvider(null, null);

      // Assert
      expect(subscription.getPaymentProvider()).toBeNull();
      expect(subscription.getProviderSubscriptionId()).toBeNull();
      expect(subscription.getUpdatedAt()).not.toBe(previousUpdatedAt);
      expect(subscription.getUpdatedAt()).toEqual(
        new Date("2024-01-01T12:00:00Z"),
      );
    });
  });

  describe("isInTrial", () => {
    it("should return true when current date is within trial period", () => {
      // Arrange
      const fixedDate = new Date("2024-01-01T12:00:00Z");
      jest.setSystemTime(fixedDate);

      const trialStart = new Date("2023-12-15");
      const trialEnd = new Date("2024-01-15");
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart,
        trialEnd,
      });

      // Act & Assert
      expect(subscription.isInTrial()).toBe(true);
    });

    it("should return false when trial period hasn't started yet", () => {
      // Arrange
      const fixedDate = new Date("2024-01-01T12:00:00Z");
      jest.setSystemTime(fixedDate);

      const trialStart = new Date("2024-01-15");
      const trialEnd = new Date("2024-01-30");
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart,
        trialEnd,
      });

      // Act & Assert
      expect(subscription.isInTrial()).toBe(false);
    });

    it("should return false when trial period has ended", () => {
      // Arrange
      const fixedDate = new Date("2024-01-01T12:00:00Z");
      jest.setSystemTime(fixedDate);

      const trialStart = new Date("2023-11-01");
      const trialEnd = new Date("2023-11-15");
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart,
        trialEnd,
      });

      // Act & Assert
      expect(subscription.isInTrial()).toBe(false);
    });

    it("should return false when trial dates are null", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart: null,
        trialEnd: null,
      });

      // Act & Assert
      expect(subscription.isInTrial()).toBe(false);
    });

    it("should return false when only trialStart is set", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart: new Date("2023-12-01"),
        trialEnd: null,
      });

      // Act & Assert
      expect(subscription.isInTrial()).toBe(false);
    });

    it("should return false when only trialEnd is set", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        trialStart: null,
        trialEnd: new Date("2024-01-15"),
      });

      // Act & Assert
      expect(subscription.isInTrial()).toBe(false);
    });
  });

  describe("isActive", () => {
    it("should return true when status is ACTIVE", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        status: SubscriptionStatus.ACTIVE,
      });

      // Act & Assert
      expect(subscription.isActive()).toBe(true);
    });

    it("should return true when status is TRIALING", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        status: SubscriptionStatus.TRIALING,
      });

      // Act & Assert
      expect(subscription.isActive()).toBe(true);
    });

    it("should return false when status is CANCELED", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        status: SubscriptionStatus.CANCELED,
      });

      // Act & Assert
      expect(subscription.isActive()).toBe(false);
    });

    it("should return false when status is PAST_DUE", () => {
      // Arrange
      const subscription = new Subscription({
        ...createValidSubscriptionParams(),
        status: SubscriptionStatus.PAST_DUE,
      });

      // Act & Assert
      expect(subscription.isActive()).toBe(false);
    });
  });
});
