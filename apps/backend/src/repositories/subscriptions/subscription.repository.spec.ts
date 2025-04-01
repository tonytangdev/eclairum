import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { SubscriptionRepositoryImpl } from './subscription.repository';
import { SubscriptionEntity } from '../../common/entities/subscription.entity';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';
import { SubscriptionMapper } from './mappers/subscription.mapper';

// Mock TypeORM Repository methods
type MockRepository<T extends Record<string, any> = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;
const createMockRepository = <
  T extends Record<string, any> = any,
>(): MockRepository<T> => ({
  save: jest.fn(),
  findOne: jest.fn(),
});

// Mock the static mapper methods
jest.mock('./mappers/subscription.mapper');

// Helper to create mock domain Subscription
const createMockDomainSubscription = (
  overrides: Partial<Subscription> = {},
): Subscription => {
  const id = overrides.id ?? faker.string.uuid();
  const userId = overrides.userId ?? faker.string.uuid();
  const stripeSubscriptionId =
    overrides.stripeSubscriptionId ?? `sub_${faker.string.alphanumeric(14)}`;
  const stripeCustomerId =
    overrides.stripeCustomerId ?? `cus_${faker.string.alphanumeric(14)}`;
  const status =
    overrides.status ?? faker.helpers.objectValue(SubscriptionStatus);
  const currentPeriodStart = overrides.currentPeriodStart ?? faker.date.past();
  const currentPeriodEnd = overrides.currentPeriodEnd ?? faker.date.future();
  const cancelAtPeriodEnd = overrides.cancelAtPeriodEnd ?? false;
  const createdAt = overrides.createdAt ?? new Date();
  const updatedAt = overrides.updatedAt ?? new Date();
  const stripePriceId =
    overrides.stripePriceId ?? `price_${faker.string.alphanumeric(14)}`;

  // Use reconstitute as it's closer to what the repo returns
  const sub = Subscription.reconstitute({
    id,
    userId,
    stripeSubscriptionId,
    stripeCustomerId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    createdAt,
    updatedAt,
    stripePriceId,
    canceledAt: null,
    ...overrides, // Apply overrides again for things like canceledAt
  });
  return sub;
};

// Helper function to create a mock SubscriptionEntity
const createMockSubscriptionEntity = (
  overrides: Partial<SubscriptionEntity> = {},
): SubscriptionEntity => {
  const entity = new SubscriptionEntity();
  entity.id = overrides.id ?? faker.string.uuid();
  entity.userId = overrides.userId ?? faker.string.uuid();
  entity.stripeSubscriptionId =
    overrides.stripeSubscriptionId ?? `sub_${faker.string.alphanumeric(14)}`;
  entity.status =
    overrides.status ?? faker.helpers.objectValue(SubscriptionStatus);
  entity.currentPeriodEnd = overrides.currentPeriodEnd ?? faker.date.future();
  entity.cancelAtPeriodEnd = overrides.cancelAtPeriodEnd ?? false;
  entity.currentPeriodStart = overrides.currentPeriodStart ?? faker.date.past();
  entity.canceledAt =
    overrides.canceledAt === undefined ? null : overrides.canceledAt;
  entity.createdAt = overrides.createdAt ?? faker.date.past();
  entity.updatedAt = overrides.updatedAt ?? faker.date.recent();
  entity.stripeCustomerId =
    overrides.stripeCustomerId ?? `cus_${faker.string.alphanumeric(14)}`;
  entity.stripePriceId =
    overrides.stripePriceId ?? `price_${faker.string.alphanumeric(14)}`;
  return entity;
};

describe('SubscriptionRepositoryImpl', () => {
  let repository: SubscriptionRepositoryImpl;
  let mockTypeOrmRepo: MockRepository<SubscriptionEntity>;

  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRepositoryImpl,
        {
          provide: getRepositoryToken(SubscriptionEntity),
          useValue: createMockRepository<SubscriptionEntity>(),
        },
      ],
    }).compile();

    repository = module.get<SubscriptionRepositoryImpl>(
      SubscriptionRepositoryImpl,
    );
    mockTypeOrmRepo = module.get<MockRepository<SubscriptionEntity>>(
      getRepositoryToken(SubscriptionEntity),
    );
  });

  describe('save', () => {
    it('should map domain to persistence, save using TypeORM repo, map back to domain, and return domain subscription', async () => {
      // Arrange
      const domainSubscription = createMockDomainSubscription();
      const persistenceEntity = createMockSubscriptionEntity({
        id: domainSubscription.id,
      });
      const savedPersistenceEntity = createMockSubscriptionEntity({
        id: domainSubscription.id,
      });
      const expectedDomainResult = createMockDomainSubscription({
        id: domainSubscription.id,
      });

      // Mock the static mapper methods
      (SubscriptionMapper.toPersistence as jest.Mock).mockReturnValue(
        persistenceEntity,
      );
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(
        expectedDomainResult,
      );
      mockTypeOrmRepo.save!.mockResolvedValue(savedPersistenceEntity);

      // Act
      const result = await repository.save(domainSubscription);

      // Assert
      expect(SubscriptionMapper.toPersistence).toHaveBeenCalledWith(
        domainSubscription,
      );
      expect(mockTypeOrmRepo.save!).toHaveBeenCalledWith(persistenceEntity);
      expect(SubscriptionMapper.toDomain).toHaveBeenCalledWith(
        savedPersistenceEntity,
      );
      expect(result).toBe(expectedDomainResult);
    });
  });

  describe('findByUserId', () => {
    it('should find entity by userId, map to domain, and return domain subscription if found', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const foundEntity = createMockSubscriptionEntity({ userId });
      const expectedDomainResult = createMockDomainSubscription({ userId });

      mockTypeOrmRepo.findOne!.mockResolvedValue(foundEntity);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(
        expectedDomainResult,
      );

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(SubscriptionMapper.toDomain).toHaveBeenCalledWith(foundEntity);
      expect(result).toBe(expectedDomainResult);
    });

    it('should return null if entity is not found by userId', async () => {
      // Arrange
      const userId = faker.string.uuid();
      mockTypeOrmRepo.findOne!.mockResolvedValue(null);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(SubscriptionMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByStripeSubscriptionId', () => {
    it('should find entity by stripeSubscriptionId, map to domain, and return domain subscription if found', async () => {
      // Arrange
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      const foundEntity = createMockSubscriptionEntity({
        stripeSubscriptionId,
      });
      const expectedDomainResult = createMockDomainSubscription({
        stripeSubscriptionId,
      });

      mockTypeOrmRepo.findOne!.mockResolvedValue(foundEntity);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(
        expectedDomainResult,
      );

      // Act
      const result =
        await repository.findByStripeSubscriptionId(stripeSubscriptionId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: { stripeSubscriptionId },
      });
      expect(SubscriptionMapper.toDomain).toHaveBeenCalledWith(foundEntity);
      expect(result).toBe(expectedDomainResult);
    });

    it('should return null if entity is not found by stripeSubscriptionId', async () => {
      // Arrange
      const stripeSubscriptionId = `sub_${faker.string.alphanumeric(14)}`;
      mockTypeOrmRepo.findOne!.mockResolvedValue(null);

      // Act
      const result =
        await repository.findByStripeSubscriptionId(stripeSubscriptionId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: { stripeSubscriptionId },
      });
      expect(SubscriptionMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find entity by id, map to domain, and return domain subscription if found', async () => {
      // Arrange
      const id = faker.string.uuid();
      const foundEntity = createMockSubscriptionEntity({ id });
      const expectedDomainResult = createMockDomainSubscription({ id });

      mockTypeOrmRepo.findOne!.mockResolvedValue(foundEntity);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(
        expectedDomainResult,
      );

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: { id },
      });
      expect(SubscriptionMapper.toDomain).toHaveBeenCalledWith(foundEntity);
      expect(result).toBe(expectedDomainResult);
    });

    it('should return null if entity is not found by id', async () => {
      // Arrange
      const id = faker.string.uuid();
      mockTypeOrmRepo.findOne!.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: { id },
      });
      expect(SubscriptionMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active entity by userId, map to domain, and return domain subscription if found', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const foundEntity = createMockSubscriptionEntity({
        userId,
        status: SubscriptionStatus.ACTIVE,
      });
      const expectedDomainResult = createMockDomainSubscription({
        userId,
        status: SubscriptionStatus.ACTIVE,
      });

      mockTypeOrmRepo.findOne!.mockResolvedValue(foundEntity);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(
        expectedDomainResult,
      );

      // Act
      const result = await repository.findActiveByUserId(userId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
      });
      expect(SubscriptionMapper.toDomain).toHaveBeenCalledWith(foundEntity);
      expect(result).toBe(expectedDomainResult);
    });

    it('should return null if no active entity is found for userId', async () => {
      // Arrange
      const userId = faker.string.uuid();
      mockTypeOrmRepo.findOne!.mockResolvedValue(null);

      // Act
      const result = await repository.findActiveByUserId(userId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
      });
      expect(SubscriptionMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if found entity is not active', async () => {
      // Arrange
      const userId = faker.string.uuid();

      mockTypeOrmRepo.findOne!.mockResolvedValue(null);

      // Act
      const result = await repository.findActiveByUserId(userId);

      // Assert
      expect(mockTypeOrmRepo.findOne!).toHaveBeenCalledWith({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
      });
      expect(SubscriptionMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
