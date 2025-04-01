import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { SubscriptionRepositoryImpl } from '../repositories/subscriptions/subscription.repository';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';

// Define the mock execute functions globally in the test scope
const mockSyncExecute = jest.fn();
const mockFetchExecute = jest.fn();
const mockCancelExecute = jest.fn();

// Mock the UseCase modules before importing
jest.mock('@eclairum/core/use-cases', () => ({
  SyncSubscriptionUseCase: jest.fn().mockImplementation(() => ({
    execute: mockSyncExecute, // Use the specific mock for sync
  })),
  FetchUserSubscriptionUseCase: jest.fn().mockImplementation(() => ({
    execute: mockFetchExecute, // Use the specific mock for fetch
  })),
  CancelSubscriptionUseCase: jest.fn().mockImplementation(() => ({
    execute: mockCancelExecute,
  })),
}));

// Import the mocked modules
import {
  SyncSubscriptionUseCase,
  FetchUserSubscriptionUseCase,
  CancelSubscriptionUseCase,
} from '@eclairum/core/use-cases';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let mockUserRepository: Partial<UserRepositoryImpl>;
  let mockSubscriptionRepository: Partial<SubscriptionRepositoryImpl>;
  let mockPaymentGateway: Partial<StripeService>;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  // Helper to create DTO
  const createMockSyncSubscriptionDto = (): SyncSubscriptionDto => ({
    userId: faker.string.uuid(),
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
  });

  // Helper to create mock Subscription
  const createMockSubscription = (userId: string): Subscription => {
    return Subscription.reconstitute({
      id: faker.string.uuid(),
      userId: userId,
      stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: faker.date.past(),
      currentPeriodEnd: faker.date.future(),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripePriceId: `price_${faker.string.alphanumeric(14)}`,
      canceledAt: null,
    });
  };

  beforeEach(async () => {
    // Clear mocks
    mockSyncExecute.mockClear();
    mockFetchExecute.mockClear();
    mockCancelExecute.mockClear();
    jest.clearAllMocks(); // Clear constructor mocks etc.

    // Create simple partial mocks for dependencies
    mockUserRepository = {};
    mockSubscriptionRepository = {};
    mockPaymentGateway = {};

    // Spy on Logger methods
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

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
          provide: StripeService,
          useValue: mockPaymentGateway,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    // Restore logger spies
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('sync', () => {
    it('should instantiate SyncSubscriptionUseCase with correct dependencies', async () => {
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto.userId);
      mockSyncExecute.mockResolvedValueOnce(mockResult);
      await service.sync(dto);
      expect(SyncSubscriptionUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockSubscriptionRepository,
        mockPaymentGateway,
      );
    });

    it('should call SyncSubscriptionUseCase.execute with correct parameters', async () => {
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto.userId);
      mockSyncExecute.mockResolvedValueOnce(mockResult);
      await service.sync(dto);
      expect(mockSyncExecute).toHaveBeenCalledWith({
        userId: dto.userId,
        stripeSubscriptionId: dto.stripeSubscriptionId,
        stripeCustomerId: dto.stripeCustomerId,
      });
    });

    it('should return the result from SyncSubscriptionUseCase on success', async () => {
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto.userId);
      mockSyncExecute.mockResolvedValueOnce(mockResult);
      const result = await service.sync(dto);
      expect(result).toBe(mockResult);
    });

    it('should log success on successful sync', async () => {
      const dto = createMockSyncSubscriptionDto();
      const mockResult = createMockSubscription(dto.userId);
      const getSpy = jest.spyOn(mockResult, 'getId').mockReturnValue('sub_123');
      mockSyncExecute.mockResolvedValueOnce(mockResult);
      await service.sync(dto);
      expect(logSpy).toHaveBeenCalledWith(
        `Syncing subscription for user: ${dto.userId}, Stripe ID: ${dto.stripeSubscriptionId}`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Subscription synced successfully: ID sub_123`,
      );
      getSpy.mockRestore();
    });

    it('should handle errors from SyncSubscriptionUseCase, log, and re-throw', async () => {
      const dto = createMockSyncSubscriptionDto();
      const testError = new Error('Use case failed!');
      mockSyncExecute.mockRejectedValueOnce(testError);
      await expect(service.sync(dto)).rejects.toThrow(testError);
      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to sync subscription for user ${dto.userId}: ${testError.message}`,
        testError.stack,
        { dto },
      );
      expect(SyncSubscriptionUseCase).toHaveBeenCalled();
      expect(mockSyncExecute).toHaveBeenCalled();
    });
  });

  describe('fetchForUser', () => {
    it('should instantiate FetchUserSubscriptionUseCase with correct dependencies', async () => {
      const userId = faker.string.uuid();
      mockFetchExecute.mockResolvedValueOnce(null); // Resolves null for constructor check
      await service.fetchForUser(userId);
      expect(FetchUserSubscriptionUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockSubscriptionRepository,
      );
    });

    it('should call FetchUserSubscriptionUseCase.execute with correct userId', async () => {
      const userId = faker.string.uuid();
      const mockResult = createMockSubscription(userId);
      mockFetchExecute.mockResolvedValueOnce(mockResult);
      await service.fetchForUser(userId);
      expect(mockFetchExecute).toHaveBeenCalledWith({ userId });
    });

    it('should return the subscription and log success when found', async () => {
      const userId = faker.string.uuid();
      const mockResult = createMockSubscription(userId);
      const getSpy = jest.spyOn(mockResult, 'getId').mockReturnValue('sub_456');
      mockFetchExecute.mockResolvedValueOnce(mockResult);
      const result = await service.fetchForUser(userId);
      expect(result).toBe(mockResult);
      expect(logSpy).toHaveBeenCalledWith(
        `Fetching subscription for user: ${userId}`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Subscription found for user ${userId}: ID sub_456`,
      );
      getSpy.mockRestore();
    });

    it('should return null and log when no subscription is found', async () => {
      const userId = faker.string.uuid();
      mockFetchExecute.mockResolvedValueOnce(null);
      const result = await service.fetchForUser(userId);
      expect(result).toBeNull();
      expect(logSpy).toHaveBeenCalledWith(
        `Fetching subscription for user: ${userId}`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `No active subscription found for user ${userId}.`,
      );
    });

    it("should catch 'User not found' error, log warning, and throw NotFoundException", async () => {
      // Arrange
      const userId = faker.string.uuid();
      // Corrected error instantiation
      const testError = new Error(`User with ID ${userId} not found.`); // Error from use case
      mockFetchExecute.mockRejectedValueOnce(testError);

      // Act
      const promise = service.fetchForUser(userId);

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `User with ID ${userId} not found.`, // Message from NotFoundException
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `User not found when fetching subscription: ${userId}`,
      );
      expect(FetchUserSubscriptionUseCase).toHaveBeenCalled();
      expect(mockFetchExecute).toHaveBeenCalledWith({ userId });
    });

    it('should handle other errors from use case, log error, and re-throw', async () => {
      const userId = faker.string.uuid();
      const testError = new Error('Database connection failed!');
      mockFetchExecute.mockRejectedValueOnce(testError);
      await expect(service.fetchForUser(userId)).rejects.toThrow(testError);
      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to fetch subscription for user ${userId}: ${testError.message}`,
        testError.stack,
      );
      expect(FetchUserSubscriptionUseCase).toHaveBeenCalled();
      expect(mockFetchExecute).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should instantiate CancelSubscriptionUseCase with correct dependencies', async () => {
      const userId = faker.string.uuid();
      const mockResult = createMockSubscription(userId);
      mockCancelExecute.mockResolvedValueOnce(mockResult);
      await service.cancel(userId, false);
      expect(CancelSubscriptionUseCase).toHaveBeenCalledWith(
        mockUserRepository,
        mockSubscriptionRepository,
      );
    });

    it('should call CancelSubscriptionUseCase.execute with correct parameters', async () => {
      const userId = faker.string.uuid();
      const mockResult = createMockSubscription(userId);
      mockCancelExecute.mockResolvedValueOnce(mockResult);
      await service.cancel(userId, true);
      expect(mockCancelExecute).toHaveBeenCalledWith({
        userId,
        cancelAtPeriodEnd: true,
      });
    });

    it('should return the result from CancelSubscriptionUseCase on success', async () => {
      const userId = faker.string.uuid();
      const mockResult = createMockSubscription(userId);
      mockCancelExecute.mockResolvedValueOnce(mockResult);
      const result = await service.cancel(userId, false);
      expect(result).toBe(mockResult);
    });

    it('should log success on successful cancellation', async () => {
      const userId = faker.string.uuid();
      const mockResult = createMockSubscription(userId);
      const getSpy = jest.spyOn(mockResult, 'getId').mockReturnValue('sub_789');
      mockCancelExecute.mockResolvedValueOnce(mockResult);
      await service.cancel(userId, false);
      expect(logSpy).toHaveBeenCalledWith(
        `Canceling subscription for user: ${userId}, cancelAtPeriodEnd: false`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Subscription canceled successfully: ID sub_789`,
      );
      getSpy.mockRestore();
    });

    it("should catch 'User not found' error, log warning, and throw NotFoundException", async () => {
      const userId = faker.string.uuid();
      const testError = new Error(`User with ID ${userId} not found.`);
      mockCancelExecute.mockRejectedValueOnce(testError);

      const promise = service.cancel(userId, false);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `User with ID ${userId} not found.`,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `User not found when canceling subscription: ${userId}`,
      );
      expect(CancelSubscriptionUseCase).toHaveBeenCalled();
      expect(mockCancelExecute).toHaveBeenCalled();
    });

    it("should catch 'No active subscription' error, log warning, and throw NotFoundException", async () => {
      const userId = faker.string.uuid();
      const testError = new Error(
        `No active subscription found for user ${userId}.`,
      );
      mockCancelExecute.mockRejectedValueOnce(testError);

      const promise = service.cancel(userId, false);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `No active subscription found for user ${userId}.`,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `No active subscription found when canceling: ${userId}`,
      );
      expect(CancelSubscriptionUseCase).toHaveBeenCalled();
      expect(mockCancelExecute).toHaveBeenCalled();
    });

    it('should handle other errors from use case, log error, and re-throw', async () => {
      const userId = faker.string.uuid();
      const testError = new Error('Database connection failed!');
      mockCancelExecute.mockRejectedValueOnce(testError);
      await expect(service.cancel(userId, false)).rejects.toThrow(testError);
      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to cancel subscription for user ${userId}: ${testError.message}`,
        testError.stack,
      );
      expect(CancelSubscriptionUseCase).toHaveBeenCalled();
      expect(mockCancelExecute).toHaveBeenCalled();
    });
  });
});
