import { faker } from "@faker-js/faker";
import { Subscription, SubscriptionStatus } from "../entities/subscription";
import { User } from "../entities/user";
import { CancelSubscriptionUseCase } from "./cancel-subscription.use-case";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import { type UserRepository } from "../interfaces/user-repository.interface";

// Helper to create mock Subscription
const createMockSubscription = (
  override: Partial<Subscription> = {},
): Subscription => {
  const defaultProps = {
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
  return Subscription.create({ ...defaultProps, ...override });
};

// Helper to create mock User
const createMockUser = (id: string): User => {
  return new User({
    id,
    email: faker.internet.email(),
  });
};

describe("CancelSubscriptionUseCase", () => {
  let useCase: CancelSubscriptionUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let subscriptionRepository: jest.Mocked<SubscriptionRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    subscriptionRepository = {
      findActiveByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepository>;

    useCase = new CancelSubscriptionUseCase(
      userRepository,
      subscriptionRepository,
    );
  });

  describe("execute", () => {
    const userId = faker.string.uuid();
    const input = {
      userId,
      cancelAtPeriodEnd: false,
    };

    it("should cancel a subscription immediately", async () => {
      // Given: A user with an active subscription
      const user = createMockUser(userId);
      const subscription = createMockSubscription({ userId });
      userRepository.findById.mockResolvedValue(user);
      subscriptionRepository.findActiveByUserId.mockResolvedValue(subscription);
      subscriptionRepository.save.mockResolvedValue(subscription);

      // When: Canceling the subscription
      const result = await useCase.execute(input);

      // Then: The subscription should be canceled
      expect(result).toBe(subscription);
      expect(subscriptionRepository.save).toHaveBeenCalledWith(subscription);
    });

    it("should cancel a subscription at the end of the period", async () => {
      // Given: A user with an active subscription
      const user = createMockUser(userId);
      const subscription = createMockSubscription({ userId });
      userRepository.findById.mockResolvedValue(user);
      subscriptionRepository.findActiveByUserId.mockResolvedValue(subscription);
      subscriptionRepository.save.mockResolvedValue(subscription);

      // When: Canceling the subscription at the end of the period
      const result = await useCase.execute({
        ...input,
        cancelAtPeriodEnd: true,
      });

      // Then: The subscription should be marked to cancel at period end
      expect(result).toBe(subscription);
      expect(subscriptionRepository.save).toHaveBeenCalledWith(subscription);
    });

    it("should throw an error if the user is not found", async () => {
      // Given: A non-existent user
      userRepository.findById.mockResolvedValue(null);

      // When/Then: Attempting to cancel the subscription
      await expect(useCase.execute(input)).rejects.toThrow(
        `User with ID ${userId} not found.`,
      );
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw an error if no active subscription is found", async () => {
      // Given: A user without an active subscription
      const user = createMockUser(userId);
      userRepository.findById.mockResolvedValue(user);
      subscriptionRepository.findActiveByUserId.mockResolvedValue(null);

      // When/Then: Attempting to cancel the subscription
      await expect(useCase.execute(input)).rejects.toThrow(
        `No active subscription found for user ${userId}.`,
      );
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("should throw an error if the subscription is not active", async () => {
      // Given: A user with a non-active subscription
      const user = createMockUser(userId);
      const subscription = createMockSubscription({
        userId,
        status: SubscriptionStatus.CANCELED,
      });
      userRepository.findById.mockResolvedValue(user);
      subscriptionRepository.findActiveByUserId.mockResolvedValue(subscription);

      // When/Then: Attempting to cancel the subscription
      await expect(useCase.execute(input)).rejects.toThrow(
        `Subscription ${subscription.id} is not active and cannot be canceled. Current status: ${subscription.status}`,
      );
      expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });
  });
});
