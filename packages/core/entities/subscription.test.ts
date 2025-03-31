import { faker } from "@faker-js/faker";
import {
  Subscription,
  SubscriptionStatus,
  type SubscriptionProps,
} from "./subscription";

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
      expect(subscription.canceledAt).toEqual(expectedUpdateTime); // canceledAt reflects when the request was made
    });

    // Tests for providing canceledAt date explicitly
    it("should override canceledAt with the provided date when canceling an active subscription", () => {
      // Given: An active subscription and fixed initial time
      const initialTime = new Date();
      const subscription: Subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: null, // Initially not canceled
      });
      expect(subscription.canceledAt).toBeNull();

      const timeToAdvance = 1000 * 60 * 3; // 3 minutes
      const specificCanceledAtDate = faker.date.future({
        refDate: initialTime,
      });

      // When: Advancing time and canceling with a specific future date
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.cancelSubscription(false, specificCanceledAtDate);

      // Then: The provided canceledAt date should be used, status updated, updatedAt reflects call time
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(subscription.canceledAt).toEqual(specificCanceledAtDate);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
      expect(subscription.cancelAtPeriodEnd).toBe(false);
    });

    it("should override an existing canceledAt with the provided date when canceling again", () => {
      // Given: An already canceled subscription with an initial cancel date
      const initialTime = new Date();
      const initialCanceledAt = faker.date.past({ refDate: initialTime });
      const subscription: Subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.CANCELED,
        currentPeriodStart: faker.date.past({ refDate: initialTime }),
        currentPeriodEnd: faker.date.future({ refDate: initialTime }),
        cancelAtPeriodEnd: false,
        canceledAt: initialCanceledAt,
      });
      expect(subscription.canceledAt).toEqual(initialCanceledAt);

      const timeToAdvance = 1000 * 60 * 4; // 4 minutes
      const newSpecificCanceledAtDate = faker.date.future({
        refDate: initialTime,
      });

      // When: Advancing time and canceling again with a *new* specific date
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      );
      subscription.cancelSubscription(false, newSpecificCanceledAtDate);

      // Then: The new provided canceledAt date should override the old one
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED); // Status remains canceled
      expect(subscription.canceledAt).toEqual(newSpecificCanceledAtDate);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime);
      expect(subscription.cancelAtPeriodEnd).toBe(false);
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

  describe("Subscription.reconstitute", () => {
    it("should reconstruct a subscription from existing properties", () => {
      // Given: Complete subscription properties
      const props: SubscriptionProps = {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      };

      // When: Reconstructing the subscription
      const subscription: Subscription = Subscription.reconstitute(props);

      // Then: All properties should match exactly
      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.id).toBe(props.id);
      expect(subscription.userId).toBe(props.userId);
      expect(subscription.stripeCustomerId).toBe(props.stripeCustomerId);
      expect(subscription.stripeSubscriptionId).toBe(
        props.stripeSubscriptionId,
      );
      expect(subscription.stripePriceId).toBe(props.stripePriceId);
      expect(subscription.status).toBe(props.status);
      expect(subscription.currentPeriodStart).toEqual(props.currentPeriodStart);
      expect(subscription.currentPeriodEnd).toEqual(props.currentPeriodEnd);
      expect(subscription.cancelAtPeriodEnd).toBe(props.cancelAtPeriodEnd);
      expect(subscription.canceledAt).toBeNull();
      expect(subscription.createdAt).toEqual(props.createdAt);
      expect(subscription.updatedAt).toEqual(props.updatedAt);
    });

    it("should handle canceledAt date when provided", () => {
      // Given: Properties with a canceledAt date
      const canceledAt = faker.date.past();
      const props: SubscriptionProps = {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.CANCELED,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: false,
        canceledAt,
        createdAt: faker.date.past(),
        updatedAt: faker.date.past(),
      };

      // When: Reconstructing the subscription
      const subscription: Subscription = Subscription.reconstitute(props);

      // Then: The canceledAt date should be preserved
      expect(subscription.canceledAt).toEqual(canceledAt);
    });
  });

  describe("Getter methods", () => {
    it("should return the correct ID", () => {
      // Given: A subscription
      const subscription: Subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });

      const expectedId = subscription.id; // Get the actual ID after creation

      // When: Getting the ID
      const result = subscription.getId();

      // Then: The ID should match the one assigned during creation
      expect(result).toBe(expectedId);
      expect(result).toEqual(expect.any(String) as string); // Also check it's a string
    });

    it("should return the correct user ID", () => {
      // Given: A subscription with a known user ID
      const userId = faker.string.uuid();
      const subscription: Subscription = Subscription.create({
        userId,
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });

      // When: Getting the user ID
      const result = subscription.getUserId();

      // Then: The user ID should match
      expect(result).toBe(userId);
    });
  });

  describe("cancelSubscription edge cases", () => {
    it("should handle cancellation of an already canceled subscription", () => {
      // Given: A subscription that's already canceled
      const initialCanceledAt = faker.date.past(); // Set a specific past date
      const initialTime = new Date(); // Capture the fixed creation time
      const subscription: Subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.CANCELED,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: false,
        canceledAt: initialCanceledAt, // Use the specific date
      });

      const timeToAdvance = 1000 * 60 * 5; // 5 minutes

      // When: Advancing time and canceling again (immediately)
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      ); // Correct base time
      subscription.cancelSubscription(false); // Try to cancel immediately again

      // Then: The original cancellation date should be preserved, updatedAt updated
      expect(subscription.canceledAt).toEqual(initialCanceledAt);
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime); // Use .toEqual for Date comparison
    });

    it("should preserve canceledAt if canceling at period end multiple times", () => {
      // Given: A subscription set to cancel at period end
      const initialCanceledAt = faker.date.past();
      const initialTime = new Date(); // Capture the fixed creation time
      const subscription: Subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: true,
        canceledAt: initialCanceledAt,
      });

      const timeToAdvance = 1000 * 60 * 5; // 5 minutes

      // When: Advancing time and setting cancelAtPeriodEnd to true again
      jest.advanceTimersByTime(timeToAdvance);
      const expectedUpdateTime = new Date(
        initialTime.getTime() + timeToAdvance,
      ); // Correct base time
      subscription.cancelSubscription(true);

      // Then: The original cancellation date should be preserved
      expect(subscription.canceledAt).toEqual(initialCanceledAt);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.cancelAtPeriodEnd).toBe(true);
      expect(subscription.updatedAt).toEqual(expectedUpdateTime); // Use .toEqual for Date comparison
    });

    it("should handle cancellation of a subscription that's set to cancel at period end", () => {
      // Given: A subscription set to cancel at period end
      const initialTime = new Date(); // Capture initial creation time
      const initialCanceledAt = faker.date.past({ refDate: initialTime }); // Date when cancelAtPeriodEnd was set
      const subscription: Subscription = Subscription.create({
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: true,
        canceledAt: initialCanceledAt,
      });

      const timeToAdvance = 1000 * 60 * 5; // 5 minutes

      // When: Advancing time and canceling immediately
      jest.advanceTimersByTime(timeToAdvance);
      const expectedCancelTime = new Date(
        initialTime.getTime() + timeToAdvance,
      ); // Should use the new time
      subscription.cancelSubscription(false);

      // Then: The subscription should be immediately canceled
      expect(subscription.canceledAt).toEqual(expectedCancelTime); // Should be the new cancel time
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.updatedAt).toEqual(expectedCancelTime); // updatedAt should match cancel time
    });
  });

  describe("Subscription.create validation", () => {
    it("should handle missing optional fields and default canceledAt to null", () => {
      // Given: Input with only required fields
      const input = {
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        cancelAtPeriodEnd: false,
        // canceledAt is omitted
      };

      // When: Creating a subscription
      const subscription: Subscription = Subscription.create(input);

      // Then: The subscription should be created with default values for optional fields
      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.canceledAt).toBeNull(); // Check for null
      expect(subscription.createdAt).toBeInstanceOf(Date);
      expect(subscription.updatedAt).toBeInstanceOf(Date);
    });

    it("should handle future dates for billing period", () => {
      // Given: Input with future dates
      const futureStart = faker.date.future();
      const futureEnd = faker.date.future({ refDate: futureStart });
      const input = {
        userId: faker.string.uuid(),
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
        stripePriceId: `price_${faker.string.alphanumeric(14)}`,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: futureStart,
        currentPeriodEnd: futureEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };

      // When: Creating a subscription
      const subscription: Subscription = Subscription.create(input);

      // Then: The dates should be preserved
      expect(subscription.currentPeriodStart).toEqual(futureStart);
      expect(subscription.currentPeriodEnd).toEqual(futureEnd);
    });
  });
});
