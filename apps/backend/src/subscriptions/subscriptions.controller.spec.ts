import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';
import { NotFoundException } from '@nestjs/common';

// Mock SubscriptionsService
const mockSubscriptionsService = {
  sync: jest.fn(),
  fetchForUser: jest.fn(),
  cancel: jest.fn(),
};

// Helper to create mock DTO
const createMockSyncSubscriptionDto = (): SyncSubscriptionDto => ({
  userId: faker.string.uuid(),
  stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
  stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
});

// Helper to create mock CancelSubscriptionDto
const createMockCancelSubscriptionDto = (): CancelSubscriptionDto => ({
  cancelAtPeriodEnd: faker.datatype.boolean(),
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

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: jest.Mocked<SubscriptionsService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    service = module.get(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sync', () => {
    it('should call subscriptionsService.sync with the provided DTO', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const expectedResult = createMockSubscription(dto.userId);
      service.sync.mockResolvedValueOnce(expectedResult); // Setup mock service

      // Act
      await controller.sync(dto);

      // Assert
      expect(service.sync).toHaveBeenCalledWith(dto);
      expect(service.sync).toHaveBeenCalledTimes(1);
    });

    it('should return the result from subscriptionsService.sync on success', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const expectedResult = createMockSubscription(dto.userId);
      service.sync.mockResolvedValueOnce(expectedResult);

      // Act
      const result = await controller.sync(dto);

      // Assert
      expect(result).toBe(expectedResult);
    });

    it('should propagate errors thrown by subscriptionsService.sync', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const testError = new Error('Service failed');
      service.sync.mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(controller.sync(dto)).rejects.toThrow(testError);
      expect(service.sync).toHaveBeenCalledWith(dto);
    });
  });

  describe('fetchForUser', () => {
    it('should call subscriptionsService.fetchForUser with the provided userId', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const expectedSubscription = createMockSubscription(userId);
      service.fetchForUser.mockResolvedValueOnce(expectedSubscription);

      // Act
      await controller.fetchForUser(userId);

      // Assert
      expect(service.fetchForUser).toHaveBeenCalledWith(userId);
      expect(service.fetchForUser).toHaveBeenCalledTimes(1);
    });

    it('should return the subscription when found by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const expectedSubscription = createMockSubscription(userId);
      service.fetchForUser.mockResolvedValueOnce(expectedSubscription);

      // Act
      const result = await controller.fetchForUser(userId);

      // Assert
      expect(result).toEqual(expectedSubscription);
    });

    it('should return null when the service does not find a subscription', async () => {
      // Arrange
      const userId = faker.string.uuid();
      service.fetchForUser.mockResolvedValueOnce(null); // Service returns null

      // Act
      const result = await controller.fetchForUser(userId);

      // Assert
      expect(result).toBeNull();
      expect(service.fetchForUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate NotFoundException thrown by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const testError = new NotFoundException(
        `User with ID ${userId} not found.`,
      );
      service.fetchForUser.mockRejectedValueOnce(testError);

      // Act
      // Call the method ONCE and store the promise
      const promise = controller.fetchForUser(userId);

      // Assert
      // Assert against the stored promise multiple times if needed
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `User with ID ${userId} not found.`,
      );
      // Verify the mock was called (it should have been called during the 'Act' phase)
      expect(service.fetchForUser).toHaveBeenCalledWith(userId);
    });

    it('should propagate other errors thrown by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const testError = new Error('Database connection error');
      service.fetchForUser.mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(controller.fetchForUser(userId)).rejects.toThrow(testError);
      expect(service.fetchForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('cancel', () => {
    it('should call subscriptionsService.cancel with the provided userId and cancelAtPeriodEnd', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dto = createMockCancelSubscriptionDto();
      const expectedResult = createMockSubscription(userId);
      service.cancel.mockResolvedValueOnce(expectedResult);

      // Act
      await controller.cancel(userId, dto);

      // Assert
      expect(service.cancel).toHaveBeenCalledWith(
        userId,
        dto.cancelAtPeriodEnd,
      );
      expect(service.cancel).toHaveBeenCalledTimes(1);
    });

    it('should return the result from subscriptionsService.cancel on success', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dto = createMockCancelSubscriptionDto();
      const expectedResult = createMockSubscription(userId);
      service.cancel.mockResolvedValueOnce(expectedResult);

      // Act
      const result = await controller.cancel(userId, dto);

      // Assert
      expect(result).toBe(expectedResult);
    });

    it('should propagate NotFoundException thrown by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dto = createMockCancelSubscriptionDto();
      const testError = new NotFoundException(
        `User with ID ${userId} not found.`,
      );
      service.cancel.mockRejectedValueOnce(testError);

      // Act
      const promise = controller.cancel(userId, dto);

      // Assert
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        `User with ID ${userId} not found.`,
      );
      expect(service.cancel).toHaveBeenCalledWith(
        userId,
        dto.cancelAtPeriodEnd,
      );
    });

    it('should propagate other errors thrown by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dto = createMockCancelSubscriptionDto();
      const testError = new Error('Database connection error');
      service.cancel.mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(controller.cancel(userId, dto)).rejects.toThrow(testError);
      expect(service.cancel).toHaveBeenCalledWith(
        userId,
        dto.cancelAtPeriodEnd,
      );
    });
  });
});
