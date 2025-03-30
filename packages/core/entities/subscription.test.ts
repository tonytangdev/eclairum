import { faker } from "@faker-js/faker";
import { Subscription, SubscriptionStatus } from "./subscription";

describe("Subscription Entity", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-01-01T00:00:00.000Z")); // Set a fixed date
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("Subscription.create", () => {
    it("should create a new subscription instance with fixed timestamps", () => {
      // Given: Valid input data and a fixed system time
      const now = new Date();
      const input = {
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: now }),
        currentPeriodEnd: faker.date.future({ refDate: now }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };

      // When: Creating a subscription
      const subscription = Subscription.create(input);

      // Then: The subscription should have the correct properties and timestamps
      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.id).toEqual(expect.any(String) as string);
      expect(subscription.userId).toBe(input.userId);
      expect(subscription.stripeCustomerId).toBe(input.stripeCustomerId);
      expect(subscription.stripeSubscriptionId).toBe(
        input.stripeSubscriptionId,
      );
      expect(subscription.stripePriceId).toBe(input.stripePriceId);
      expect(subscription.status).toBe(input.status);
      expect(subscription.currentPeriodStart).toEqual(input.currentPeriodStart);
      expect(subscription.currentPeriodEnd).toEqual(input.currentPeriodEnd);
      expect(subscription.cancelAtPeriodEnd).toBe(input.cancelAtPeriodEnd);
      expect(subscription.canceledAt).toBeNull();
      expect(subscription.createdAt).toEqual(now); // Should match the time set by jest
      expect(subscription.updatedAt).toEqual(now); // Should match the time set by jest
    });
  });

  describe("updateStatus", () => {
    it("should update the status and updatedAt timestamp", () => {
      // Given: An existing subscription and a fixed initial time
      const initialTime = new Date();
      const initialProps = {
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };
      const subscription = Subscription.create(initialProps);
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(initialTime);

      const newStatus = SubscriptionStatus.PAST_DUE;
      const timeToAdvance = 1000 * 60 * 5; // 5 minutes

      // When: Advancing time and updating the status
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.updateStatus(newStatus);

      // Then: The status and updatedAt should be updated, createdAt unchanged
      expect(subscription.status).toBe(newStatus);
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
    });
  });

  describe("cancelSubscription", () => {
    it("should set status to CANCELED and update timestamps when canceling immediately", () => {
      // Given: An active subscription and fixed initial time
      const initialTime = new Date();
      const subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(initialTime);

      const timeToAdvance = 1000 * 60 * 10; // 10 minutes

      // When: Advancing time and canceling immediately
      jest.advanceTimersByTime(timeToAdvance);
      const expectedCancelTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.cancelSubscription(false);

      // Then: Properties should reflect immediate cancellation with updated timestamps
      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(expectedCancelTime);
      expect(subscription.canceledAt).toEqual(expectedCancelTime);
    });

    it("should set cancelAtPeriodEnd and update timestamps when canceling at period end", () => {
      // Given: An active subscription and fixed initial time
      const initialTime = new Date();
      const subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(initialTime);
      const initialStatus = subscription.status;
      const timeToAdvance = 1000 * 30; // 30 seconds

      // When: Advancing time and canceling at period end
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.cancelSubscription(true);

      // Then: Properties should reflect cancellation at period end with updated timestamps
      expect(subscription.cancelAtPeriodEnd).toBe(true);
      expect(subscription.status).toBe(initialStatus); // Status should not change yet
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
      expect(subscription.canceledAt).toEqual(expectedUpdateTime);
    });

    it("should use provided canceledAt date if given", () => {
      // Given: A subscription and a specific cancellation date
      const initialTime = new Date();
      const subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(initialTime);

      const specificCanceledAt = faker.date.future({ refDate: initialTime }); // Future date
      const timeToAdvance = 1000 * 60; // 1 minute (just to show updatedAt changes)
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );

      // When: Canceling with a specific date
      subscription.cancelSubscription(false, specificCanceledAt);

      // Then: The provided canceledAt date should be used, updatedAt reflects the call time
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED); // Should still be canceled
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
      expect(subscription.canceledAt).toEqual(specificCanceledAt); // Uses the provided date
    });
  });

  describe("updateBillingPeriod", () => {
    it("should update the billing period dates and updatedAt timestamp", () => {
      // Given: An existing subscription and fixed initial time
      const initialTime = new Date();
      const subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(initialTime);

      const newStart = faker.date.recent({ refDate: initialTime });
      const newEnd = faker.date.future({ refDate: newStart });
      const timeToAdvance = 1000 * 60 * 2; // 2 minutes

      // When: Advancing time and updating the billing period
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.updateBillingPeriod(newStart, newEnd);

      // Then: The dates and updatedAt should be updated, createdAt unchanged
      expect(subscription.currentPeriodStart).toEqual(newStart);
      expect(subscription.currentPeriodEnd).toEqual(newEnd);
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
    });
  });

  describe("updatePrice", () => {
    it("should update the stripePriceId and updatedAt timestamp", () => {
      // Given: An existing subscription and fixed initial time
      const initialTime = new Date();
      const subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(initialTime);

      const newPriceId = `price_${faker.string.alphanumeric(14)}`;
      const timeToAdvance = 1000 * 10; // 10 seconds

      // When: Advancing time and updating the price ID
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.updatePrice(newPriceId);

      // Then: The price ID and updatedAt should be updated, createdAt unchanged
      expect(subscription.stripePriceId).toBe(newPriceId);
      expect(subscription.createdAt).toEqual(initialTime);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
    });
  });
});
