import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';

// Mock SubscriptionsService
const mockSubscriptionsService = {
  sync: jest.fn(),
};

// Helper to create mock DTO
const createMockSyncSubscriptionDto = (): SyncSubscriptionDto => ({
  userId: faker.string.uuid(),
  stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
  stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`, // Include optional field
});

// Helper to create mock Subscription
const createMockSubscription = (dto: SyncSubscriptionDto): Subscription => {
  // Using reconstitute as it represents a complete entity
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
    canceledAt: null, // Assuming not cancelled for a typical successful sync
  });
};

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: jest.Mocked<SubscriptionsService>;

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks before each test

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
    // Get the mocked service instance
    service = module.get(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sync', () => {
    it('should call subscriptionsService.sync with the provided DTO', async () => {
      // Arrange
      const dto = createMockSyncSubscriptionDto();
      const expectedResult = createMockSubscription(dto);
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
      const expectedResult = createMockSubscription(dto);
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
});
