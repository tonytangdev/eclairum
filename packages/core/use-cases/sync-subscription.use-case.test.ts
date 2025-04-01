import { faker } from "@faker-js/faker";
import { User } from "../entities/user";
import { Subscription, SubscriptionStatus } from "../entities/subscription";
import { SyncSubscriptionUseCase } from "./sync-subscription.use-case";
import { type UserRepository } from "../interfaces/user-repository.interface";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import {
  type PaymentGateway,
  type GetSubscriptionOutput,
  type CreateCustomerOutput,
} from "../interfaces/payment-gateway.interface";

// Mocks
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  findByEmail: jest.fn(),
};

const mockSubscriptionRepository: jest.Mocked<SubscriptionRepository> = {
  save: jest.fn(),
  findByUserId: jest.fn(),
  findByStripeSubscriptionId: jest.fn(),
  findActiveByUserId: jest.fn(),
  findById: jest.fn(),
};

const mockPaymentGateway: jest.Mocked<PaymentGateway> = {
  findCustomerByUserId: jest.fn(),
  getSubscription: jest.fn(),
};

// Helper to create mock User
const createMockUser = (override: Partial<User> = {}): User => {
  const user = new User({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
    deletedAt: null,
    ...override,
  });
  // Mock getters
  jest.spyOn(user, "getId").mockReturnValue(user.getId());
  jest.spyOn(user, "getEmail").mockReturnValue(user.getEmail());
  return user;
};

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
  const subscription = Subscription.create({ ...defaultProps, ...override });
  // Spy on update methods if needed for specific tests
  jest.spyOn(subscription, "updateStatus");
  jest.spyOn(subscription, "updateBillingPeriod");
  jest.spyOn(subscription, "updatePrice");
  return subscription;
};

describe("SyncSubscriptionUseCase", () => {
  let syncSubscriptionUseCase: SyncSubscriptionUseCase;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    syncSubscriptionUseCase = new SyncSubscriptionUseCase(
      mockUserRepository,
      mockSubscriptionRepository,
      mockPaymentGateway,
    );
  });

  // --- Success Scenarios ---

  describe("when subscription does not exist locally", () => {
    it("should fetch user, customer, subscription, create local record, and save it", async () => {
      // Given
      const user = createMockUser();
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      const stripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      const input = { userId: user.getId(), stripeSubscriptionId };

      const mockGatewayCustomer = {
        customerId: stripeCustomerId,
      };
      const mockGatewaySubscription: GetSubscriptionOutput = {
        subscriptionId: stripeSubscriptionId,
        status: "active",
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        priceId: `price_${faker.string.alphanumeric(14)}`,
        cancelAtPeriodEnd: false,
        customerId: stripeCustomerId, // Belongs to the correct customer
      };
      const expectedCreatedSubscription = Subscription.create({
        userId: user.getId(),
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId: mockGatewaySubscription.priceId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: mockGatewaySubscription.currentPeriodStart,
        currentPeriodEnd: mockGatewaySubscription.currentPeriodEnd,
        cancelAtPeriodEnd: mockGatewaySubscription.cancelAtPeriodEnd,
        canceledAt: null,
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockPaymentGateway.findCustomerByUserId.mockResolvedValue(
        mockGatewayCustomer,
      );
      mockPaymentGateway.getSubscription.mockResolvedValue(
        mockGatewaySubscription,
      );
      mockSubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(
        null,
      ); // Does not exist locally
      mockSubscriptionRepository.save.mockResolvedValue(
        expectedCreatedSubscription,
      );

      // Spy on Subscription.create
      const createSpy = jest.spyOn(Subscription, "create");

      // When
      const result = await syncSubscriptionUseCase.execute(input);

      // Then
      expect(mockUserRepository.findById).toHaveBeenCalledWith(user.getId());
      expect(mockPaymentGateway.findCustomerByUserId).toHaveBeenCalledWith(
        user.getId(),
      );
      expect(mockPaymentGateway.getSubscription).toHaveBeenCalledWith(
        stripeSubscriptionId,
      );
      expect(
        mockSubscriptionRepository.findByStripeSubscriptionId,
      ).toHaveBeenCalledWith(stripeSubscriptionId);
      expect(createSpy).toHaveBeenCalledWith({
        userId: user.getId(),
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId: mockGatewaySubscription.priceId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: mockGatewaySubscription.currentPeriodStart,
        currentPeriodEnd: mockGatewaySubscription.currentPeriodEnd,
        cancelAtPeriodEnd: mockGatewaySubscription.cancelAtPeriodEnd,
        canceledAt: null,
      });
      expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
        expect.any(Subscription),
      );
      expect(result).toEqual(expectedCreatedSubscription);

      createSpy.mockRestore(); // Clean up spy
    });

    it("should use provided stripeCustomerId when available", async () => {
      // Given
      const user = createMockUser();
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      const stripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      const input = {
        userId: user.getId(),
        stripeSubscriptionId,
        stripeCustomerId, // Provide the customer ID
      };

      const mockGatewaySubscription: GetSubscriptionOutput = {
        subscriptionId: stripeSubscriptionId,
        status: "active",
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        priceId: `price_${faker.string.alphanumeric(14)}`,
        cancelAtPeriodEnd: false,
        customerId: stripeCustomerId,
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockPaymentGateway.getSubscription.mockResolvedValue(
        mockGatewaySubscription,
      );
      mockSubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(
        null,
      );
      mockSubscriptionRepository.save.mockImplementation((sub) =>
        Promise.resolve(sub),
      );

      // When
      await syncSubscriptionUseCase.execute(input);

      // Then
      expect(mockPaymentGateway.findCustomerByUserId).not.toHaveBeenCalled();
      expect(mockPaymentGateway.getSubscription).toHaveBeenCalledWith(
        stripeSubscriptionId,
      );
    });

    // Add tests for specific status mappings
    it.each([
      {
        gatewayStatus: "past_due",
        expectedStatus: SubscriptionStatus.PAST_DUE,
      },
      {
        gatewayStatus: "canceled",
        expectedStatus: SubscriptionStatus.CANCELED,
      },
      { gatewayStatus: "unpaid", expectedStatus: SubscriptionStatus.UNPAID },
      {
        gatewayStatus: "incomplete",
        expectedStatus: SubscriptionStatus.INCOMPLETE,
      },
      {
        gatewayStatus: "incomplete_expired",
        expectedStatus: SubscriptionStatus.INCOMPLETE_EXPIRED,
      },
      {
        gatewayStatus: "unknown_weird_status", // Test the default case
        expectedStatus: SubscriptionStatus.INCOMPLETE,
      },
    ])(
      "should map gateway status '$gatewayStatus' to '$expectedStatus'",
      async ({ gatewayStatus, expectedStatus }) => {
        // Given
        const user = createMockUser();
        const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
        const stripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
        const input = { userId: user.getId(), stripeSubscriptionId };
        console.warn = jest.fn(); // Mock console.warn for the default case test

        const mockGatewayCustomer: CreateCustomerOutput = {
          customerId: stripeCustomerId,
        };
        const mockGatewaySubscription: GetSubscriptionOutput = {
          subscriptionId: stripeSubscriptionId,
          status: gatewayStatus, // Use the status from the test case
          currentPeriodStart: faker.date.past(),
          currentPeriodEnd: faker.date.future(),
          priceId: `price_${faker.string.alphanumeric(14)}`,
          cancelAtPeriodEnd: false,
          customerId: stripeCustomerId,
        };

        mockUserRepository.findById.mockResolvedValue(user);
        mockPaymentGateway.findCustomerByUserId.mockResolvedValue(
          mockGatewayCustomer,
        );
        mockPaymentGateway.getSubscription.mockResolvedValue(
          mockGatewaySubscription,
        );
        mockSubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(
          null,
        ); // Assume not found locally
        mockSubscriptionRepository.save.mockImplementation((sub) =>
          Promise.resolve(sub),
        );

        const createSpy = jest.spyOn(Subscription, "create");

        // When
        await syncSubscriptionUseCase.execute(input);

        // Then
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({ status: expectedStatus }), // Check the mapped status
        );

        // Additionally check console.warn for the default case
        if (gatewayStatus === "unknown_weird_status") {
          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining(gatewayStatus),
          );
        }

        createSpy.mockRestore();
      },
    );
  });

  describe("when subscription already exists locally", () => {
    it("should fetch user, customer, subscription, update local record, and save it", async () => {
      // Given
      const user = createMockUser();
      const existingSubscription = createMockSubscription({
        userId: user.getId(),
        status: SubscriptionStatus.PAST_DUE, // Start with a different status
      });
      const stripeSubscriptionId = existingSubscription.stripeSubscriptionId;
      const stripeCustomerId = existingSubscription.stripeCustomerId;
      const input = { userId: user.getId(), stripeSubscriptionId };

      const mockGatewayCustomer = {
        customerId: stripeCustomerId,
      };
      const mockGatewaySubscription: GetSubscriptionOutput = {
        subscriptionId: stripeSubscriptionId,
        status: "active", // Fetched status is now active
        currentPeriodStart: faker.date.recent(), // New dates
        currentPeriodEnd: faker.date.future(),
        priceId: `price_${faker.string.alphanumeric(14)}`, // New price ID
        cancelAtPeriodEnd: false,
        customerId: stripeCustomerId, // Belongs to the correct customer
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockPaymentGateway.findCustomerByUserId.mockResolvedValue(
        mockGatewayCustomer,
      );
      mockPaymentGateway.getSubscription.mockResolvedValue(
        mockGatewaySubscription,
      );
      mockSubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(
        existingSubscription,
      );
      mockSubscriptionRepository.save.mockResolvedValue(existingSubscription);

      // Spy on Subscription.create to ensure it's NOT called
      const createSpy = jest.spyOn(Subscription, "create");

      // When
      const result = await syncSubscriptionUseCase.execute(input);

      // Then
      expect(mockUserRepository.findById).toHaveBeenCalledWith(user.getId());
      expect(mockPaymentGateway.findCustomerByUserId).toHaveBeenCalledWith(
        user.getId(),
      );
      expect(mockPaymentGateway.getSubscription).toHaveBeenCalledWith(
        stripeSubscriptionId,
      );
      expect(
        mockSubscriptionRepository.findByStripeSubscriptionId,
      ).toHaveBeenCalledWith(stripeSubscriptionId);
      expect(createSpy).not.toHaveBeenCalled();

      // Check that update methods were called on the existing instance
      expect(existingSubscription.updateStatus).toHaveBeenCalledWith(
        SubscriptionStatus.ACTIVE,
      );
      expect(existingSubscription.updateBillingPeriod).toHaveBeenCalledWith(
        mockGatewaySubscription.currentPeriodStart,
        mockGatewaySubscription.currentPeriodEnd,
      );
      expect(existingSubscription.updatePrice).toHaveBeenCalledWith(
        mockGatewaySubscription.priceId,
      );
      expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
        existingSubscription,
      );
      expect(result).toBe(existingSubscription);

      createSpy.mockRestore();
    });
  });

  // --- Failure Scenarios ---

  describe("when user is not found", () => {
    it("should throw an error", async () => {
      // Given
      const userId = faker.string.uuid();
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      const input = { userId, stripeSubscriptionId };

      mockUserRepository.findById.mockResolvedValue(null); // User not found

      // When & Then
      await expect(syncSubscriptionUseCase.execute(input)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });
  });

  describe("when fetched subscription belongs to a different customer", () => {
    it("should log an error and throw an exception", async () => {
      // Given
      const user = createMockUser();
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      const correctStripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      const wrongStripeCustomerId = `cus_${faker.string.alphanumeric(14)}`; // Different ID
      const input = { userId: user.getId(), stripeSubscriptionId };

      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const mockGatewayCustomer: CreateCustomerOutput = {
        customerId: correctStripeCustomerId, // User is linked to this customer ID
      };
      const mockGatewaySubscription: GetSubscriptionOutput = {
        subscriptionId: stripeSubscriptionId,
        status: "active",
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        priceId: `price_${faker.string.alphanumeric(14)}`,
        cancelAtPeriodEnd: false,
        customerId: wrongStripeCustomerId, // Subscription belongs to THIS customer ID
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockPaymentGateway.findCustomerByUserId.mockResolvedValue(
        mockGatewayCustomer,
      );
      mockPaymentGateway.getSubscription.mockResolvedValue(
        mockGatewaySubscription, // Fetched subscription has wrong customer ID
      );

      // When & Then
      const expectedErrorMessage = `Subscription ${stripeSubscriptionId} does not belong to the specified user or the expected customer.`;
      await expect(syncSubscriptionUseCase.execute(input)).rejects.toThrow(
        expectedErrorMessage,
      );

      // Check console.error was called with the single formatted string
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `Subscription mismatch: User ${user.getId()} tried to sync Stripe subscription ${stripeSubscriptionId} which belongs to Stripe customer ${wrongStripeCustomerId}, but the user should be linked to ${correctStripeCustomerId}.`,
        ),
      );

      // Ensure subsequent steps weren't taken
      expect(
        mockSubscriptionRepository.findByStripeSubscriptionId,
      ).not.toHaveBeenCalled();
      expect(mockSubscriptionRepository.save).not.toHaveBeenCalled();

      // Clean up spy
      consoleErrorSpy.mockRestore();
    });
  });

  describe("when propagate error from save", () => {
    it("should propagate error from save", async () => {
      // Given
      const user = createMockUser();
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      // Add necessary details for mocks
      const stripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      const input = { userId: user.getId(), stripeSubscriptionId };

      const repoError = new Error("Failed to save subscription");

      // --- Add required mocks for preceding steps --- START ---
      const mockGatewayCustomer: CreateCustomerOutput = {
        customerId: stripeCustomerId,
      };
      const mockGatewaySubscription: GetSubscriptionOutput = {
        subscriptionId: stripeSubscriptionId,
        status: "active",
        currentPeriodStart: faker.date.past(),
        currentPeriodEnd: faker.date.future(),
        priceId: `price_${faker.string.alphanumeric(14)}`,
        cancelAtPeriodEnd: false,
        customerId: stripeCustomerId, // Ensure customer matches
      };

      mockUserRepository.findById.mockResolvedValue(user); // Mock user found
      mockPaymentGateway.findCustomerByUserId.mockResolvedValue(
        mockGatewayCustomer,
      ); // Mock customer found/created
      mockPaymentGateway.getSubscription.mockResolvedValue(
        mockGatewaySubscription,
      ); // Mock subscription fetched
      mockSubscriptionRepository.findByStripeSubscriptionId.mockResolvedValue(
        null,
      ); // Mock subscription not found locally (to trigger create->save)
      // --- Add required mocks for preceding steps --- END ---

      // Mock the save method to throw the intended error
      mockSubscriptionRepository.save.mockRejectedValue(repoError);

      // When & Then
      await expect(syncSubscriptionUseCase.execute(input)).rejects.toThrow(
        repoError, // Now we expect the repoError
      );
    });
  });

  describe("when customer is not found", () => {
    it("should throw an error when no customer exists", async () => {
      // Given
      const user = createMockUser();
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      const input = { userId: user.getId(), stripeSubscriptionId };

      mockUserRepository.findById.mockResolvedValue(user);
      mockPaymentGateway.findCustomerByUserId.mockResolvedValue(null);

      // When & Then
      await expect(syncSubscriptionUseCase.execute(input)).rejects.toThrow(
        `No Stripe Customer ID found for user ${user.getId()}.`,
      );
    });
  });
});
