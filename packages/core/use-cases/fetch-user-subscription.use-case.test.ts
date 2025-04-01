import { faker } from "@faker-js/faker";
import { Subscription, SubscriptionStatus } from "../entities/subscription";
import { User } from "../entities/user";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import { type UserRepository } from "../interfaces/user-repository.interface";
import { FetchUserSubscriptionUseCase } from "./fetch-user-subscription.use-case";

// --- Mocks ---

// Corrected mock for UserRepository based on its interface definition
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
  // Removed findByStripeCustomerId and delete as they are not in the interface
};

// Corrected mock for SubscriptionRepository based on its interface definition
const mockSubscriptionRepository: jest.Mocked<SubscriptionRepository> = {
  // Removed findById as it's not in the interface
  findByUserId: jest.fn(),
  findByStripeSubscriptionId: jest.fn(),
  save: jest.fn(),
  findActiveByUserId: jest.fn(),
  findById: jest.fn(),
  // Removed delete as it's not in the interface
};

// --- Test Suite ---

describe("FetchUserSubscriptionUseCase", () => {
  let useCase: FetchUserSubscriptionUseCase;
  let userId: string;
  let mockUser: User;
  let mockSubscription: Subscription;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Instantiate the use case directly with mocks
    useCase = new FetchUserSubscriptionUseCase(
      mockUserRepository,
      mockSubscriptionRepository,
    );

    // Arrange: Basic setup using faker
    userId = faker.string.uuid();
    // Corrected: Use the User constructor
    mockUser = new User({
      id: userId, // Pass id explicitly for testing predictability
      email: faker.internet.email(),
      // Other properties like name, provider, providerId are not part of User entity per definition
    });

    // Corrected: Use Subscription.create without providing id, createdAt, updatedAt
    mockSubscription = Subscription.create({
      userId: userId,
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
      stripePriceId: `price_${faker.string.alphanumeric(14)}`,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: faker.date.past(),
      currentPeriodEnd: faker.date.future(),
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
    // Reconstitute with a known ID for consistent testing if needed, but create is fine for most tests.
    // To control the ID, you could potentially mock crypto.randomUUID or use reconstitute:
    // const knownSubId = faker.string.uuid();
    // const createdSub = Subscription.create({...});
    // mockSubscription = Subscription.reconstitute({ ...createdSub, id: knownSubId });
  });

  // --- Test Cases ---

  describe("Given a user ID", () => {
    describe("When the user exists and has a subscription", () => {
      it("Then it should return the user subscription", async () => {
        // Arrange
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockSubscriptionRepository.findByUserId.mockResolvedValue(
          mockSubscription,
        );
        const input = { userId };

        // Act
        const result = await useCase.execute(input);

        // Assert
        // Comparing the exact mockSubscription object created in beforeEach
        expect(result).toEqual(mockSubscription);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
        expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalledWith(
          userId,
        );
      });
    });

    describe("When the user exists but has no subscription", () => {
      it("Then it should return null", async () => {
        // Arrange
        mockUserRepository.findById.mockResolvedValue(mockUser);
        mockSubscriptionRepository.findByUserId.mockResolvedValue(null); // No subscription found
        const input = { userId };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result).toBeNull();
        expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
        expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalledWith(
          userId,
        );
      });
    });

    describe("When the user does not exist", () => {
      it("Then it should throw an error", async () => {
        // Arrange
        mockUserRepository.findById.mockResolvedValue(null); // User not found
        const input = { userId };

        // Act & Assert
        await expect(useCase.execute(input)).rejects.toThrow(
          `User with ID ${userId} not found.`,
        );
        expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
        expect(mockSubscriptionRepository.findByUserId).not.toHaveBeenCalled();
      });
    });
  });
});
