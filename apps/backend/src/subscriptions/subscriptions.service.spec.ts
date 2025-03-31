import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { SubscriptionRepositoryImpl } from '../repositories/subscriptions/subscription.repository';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';

// Define the mock execute function globally in the test scope
const mockExecute = jest.fn();

// Mock the SyncSubscriptionUseCase module before importing
jest.mock('@eclairum/core/use-cases', () => ({
  SyncSubscriptionUseCase: jest.fn().mockImplementation(() => ({
    // Use the globally defined mock function
    execute: mockExecute,
  })),
}));

// Import the mocked module
import { SyncSubscriptionUseCase } from '@eclairum/core/use-cases';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockSubscriptionRepository: Partial<SubscriptionRepositoryImpl>;
  let mockPaymentGateway: Partial<StripeService>;
  let loggerSpy: jest.SpyInstance;

  // Helper to create DTO
  const createMockSyncSubscriptionDto = (): SyncSubscriptionDto => ({
    userId: faker.string.uuid(),
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`, // Include optional field
  });

  // Helper to create mock Subscription
  const createMockSubscription = (dto: SyncSubscriptionDto): Subscription => {
    return Subscription.reconstitute({
      id: faker.string.uuid(),
      userId: dto.userId,
      stripeSubscriptionId: dto.stripeSubscriptionId,
      stripeCustomerId:
        dto.stripeCustomerId ?? `cus_${faker.string.alphanumeric(14)}`,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: faker.date.past(),
      currentPeriodEnd: faker.date.future(),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripePriceId: `price_${faker.string.alphanumeric(14)}`,
    });
  };

  beforeEach(async () => {
    // Clear the globally defined mock function and the constructor mock
    mockExecute.mockClear();
    jest.clearAllMocks();

    // Create simple partial mocks for dependencies
    mockUserRepository = {};
    mockSubscriptionRepository = {};
    mockPaymentGateway = {};

    // Spy on Logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: UserRepositoryImpl,
          useValue: mockUserRepository,
        },
        {
          provide: SubscriptionRepositoryImpl,
          useValue: mockSubscriptionRepository,
        },
        {
          provide: StripeService, // Use the actual service name used as token
          useValue: mockPaymentGateway,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    loggerSpy.mockRestore(); // Restore logger spy
  });

  describe('sync', () => {
    it('should instantiate SyncSubscriptionUseCase with correct dependencies', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto);

      // Set up the globally defined mock to return our result
      mockExecute.mockResolvedValueOnce(mockResult);

      // Act
      await service.sync(dto);

      // Assert
      // Check the mock *constructor* was called
      expect(SyncSubscriptionUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockSubscriptionRepository,
        mockPaymentGateway,
      );
    });

    it('should call SyncSubscriptionUseCase.execute with correct parameters', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto);

      // Set up the globally defined mock
      mockExecute.mockResolvedValueOnce(mockResult);

      // Act
      await service.sync(dto);

      // Assert
      // Check the globally defined mock *function* was called
      expect(mockExecute).toHaveBeenCalledWith({
        userId: dto.userId,
        stripeSubscriptionId: dto.stripeSubscriptionId,
        // Assert that customerId is passed from DTO
        stripeCustomerId: dto.stripeCustomerId,
      });
    });

    it('should return the result from SyncSubscriptionUseCase on success', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto);

      // Set up the globally defined mock
      mockExecute.mockResolvedValueOnce(mockResult);

      // Act
      const result = await service.sync(dto);

      // Assert
      expect(result).toBe(mockResult);
    });

    it('should log success on successful sync', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto);
      const getSpy = jest.spyOn(mockResult, 'getId');

      // Set up the globally defined mock
      mockExecute.mockResolvedValueOnce(mockResult);

      // Act
      await service.sync(dto);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `Syncing subscription for user: ${dto.userId}, Stripe ID: ${dto.stripeSubscriptionId}`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Subscription synced successfully: ID ${mockResult.getId()}`,
      );
      getSpy.mockRestore();
    });

    it('should handle errors from SyncSubscriptionUseCase, log, and re-throw', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const testError = new Error('Use case failed!');

      // Set up the globally defined mock to throw
      mockExecute.mockRejectedValueOnce(testError);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(service.sync(dto)).rejects.toThrow(testError);

      // Verify logging
      expect(errorSpy).toHaveBeenCalled();

      // Ensure mocks were still called
      expect(SyncSubscriptionUseCase).toHaveBeenCalled(); // Constructor called
      expect(mockExecute).toHaveBeenCalled(); // Execute function called
      errorSpy.mockRestore();
    });

    it('should call SyncSubscriptionUseCase.execute with correct parameters when customerId is undefined', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      dto.stripeCustomerId = undefined;
      const mockResult = createMockSubscription(dto);

      // Set up the globally defined mock
      mockExecute.mockResolvedValueOnce(mockResult);

      // Act
      await service.sync(dto);

      // Assert
      // Check the globally defined mock *function* was called
      expect(mockExecute).toHaveBeenCalledWith({
        userId: dto.userId,
        stripeSubscriptionId: dto.stripeSubscriptionId,
        // Check that undefined is passed if DTO doesn't have customerId
        stripeCustomerId: undefined,
      });
    });
  });
});
