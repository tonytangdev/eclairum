import { faker } from '@faker-js/faker';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';
import { SubscriptionEntity } from '../../../common/entities/subscription.entity';
import { SubscriptionMapper } from './subscription.mapper';

describe('SubscriptionMapper', () => {
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

    // Use Reflect.has and provide default values matching entity types
    entity.currentPeriodEnd = Reflect.has(overrides, 'currentPeriodEnd')
      ? (overrides.currentPeriodEnd ?? faker.date.future()) // Fallback if override is undefined
      : faker.date.future();
    entity.cancelAtPeriodEnd = Reflect.has(overrides, 'cancelAtPeriodEnd')
      ? (overrides.cancelAtPeriodEnd ?? faker.datatype.boolean()) // Fallback if override is undefined
      : faker.datatype.boolean();
    entity.currentPeriodStart = Reflect.has(overrides, 'currentPeriodStart')
      ? (overrides.currentPeriodStart ?? faker.date.past()) // Fallback if override is undefined (Date needed)
      : faker.date.past();
    entity.canceledAt = Reflect.has(overrides, 'canceledAt')
      ? (overrides.canceledAt ?? null) // Fallback to null if override is undefined
      : faker.helpers.arrayElement([null, faker.date.past()]);

    // Other fields
    entity.createdAt = overrides.createdAt ?? faker.date.past();
    entity.updatedAt = overrides.updatedAt ?? faker.date.recent();
    entity.stripeCustomerId =
      overrides.stripeCustomerId ?? `cus_${faker.string.alphanumeric(14)}`;
    entity.stripePriceId =
      overrides.stripePriceId ?? `price_${faker.string.alphanumeric(14)}`;

    return entity;
  };

  // Helper function to create a mock Subscription domain object
  const createMockSubscriptionDomain = (
    canceledAtValue?: Date | null,
  ): Subscription => {
    // Use reconstitute to bypass create method's default timestamps for more control
    const props = {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
      stripePriceId: `price_${faker.string.alphanumeric(14)}`,
      status: faker.helpers.objectValue(SubscriptionStatus),
      currentPeriodStart: faker.date.past(),
      currentPeriodEnd: faker.date.future(),
      cancelAtPeriodEnd: faker.datatype.boolean(),
      canceledAt: canceledAtValue ?? null, // Ensure it's null if undefined
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
    return Subscription.reconstitute(props);
  };

  describe('toDomain', () => {
    it('should correctly map a valid SubscriptionEntity to a Subscription domain object', () => {
      // Arrange
      const entity = createMockSubscriptionEntity({
        canceledAt: faker.date.past(),
      }); // Ensure canceledAt is a date

      // Act
      const domain = SubscriptionMapper.toDomain(entity);

      // Assert
      expect(domain).toBeInstanceOf(Subscription);
      expect(domain.id).toBe(entity.id);
      expect(domain.userId).toBe(entity.userId);
      expect(domain.stripeSubscriptionId).toBe(entity.stripeSubscriptionId);
      expect(domain.status).toBe(entity.status);
      expect(domain.currentPeriodEnd).toEqual(entity.currentPeriodEnd);
      expect(domain.cancelAtPeriodEnd).toBe(entity.cancelAtPeriodEnd);
      expect(domain.createdAt).toEqual(entity.createdAt);
      expect(domain.updatedAt).toEqual(entity.updatedAt);
      expect(domain.stripeCustomerId).toBe(entity.stripeCustomerId);
      expect(domain.stripePriceId).toBe(entity.stripePriceId);
      expect(domain.currentPeriodStart).toEqual(entity.currentPeriodStart);
      // Check canceledAt mapping (null -> undefined, Date -> Date)
      expect(domain.canceledAt).toEqual(entity.canceledAt ?? undefined);
    });

    it('should map null canceledAt from entity to undefined in domain', () => {
      // Arrange
      const entity = createMockSubscriptionEntity({ canceledAt: null });

      // Act
      const domain = SubscriptionMapper.toDomain(entity);

      // Assert
      expect(domain.canceledAt).toBeUndefined();
    });

    it('should throw an error if the entity is null or undefined', () => {
      // Arrange
      const nullEntity = null;
      const undefinedEntity = undefined;

      // Act & Assert
      expect(() =>
        SubscriptionMapper.toDomain(
          nullEntity as unknown as SubscriptionEntity,
        ),
      ).toThrow('Cannot map null or undefined entity to domain.');
      expect(() =>
        SubscriptionMapper.toDomain(
          undefinedEntity as unknown as SubscriptionEntity,
        ),
      ).toThrow('Cannot map null or undefined entity to domain.');
    });

    it('should throw an error if currentPeriodEnd is null', () => {
      // Arrange
      const entity = createMockSubscriptionEntity();
      // Type assertion to bypass TypeScript's type checking for testing
      entity.currentPeriodEnd = null as unknown as Date;

      // Act & Assert
      expect(() => SubscriptionMapper.toDomain(entity)).toThrow(
        'DB constraint violation: currentPeriodEnd cannot be null.',
      );
    });

    it('should throw an error if cancelAtPeriodEnd is null', () => {
      // Arrange
      const entity = createMockSubscriptionEntity();
      // Type assertion to bypass TypeScript's type checking for testing
      entity.cancelAtPeriodEnd = null as unknown as boolean;

      // Act & Assert
      expect(() => SubscriptionMapper.toDomain(entity)).toThrow(
        'DB constraint violation: cancelAtPeriodEnd cannot be null.',
      );
    });

    it('should throw an error if currentPeriodStart is null', () => {
      // Arrange
      const entity = createMockSubscriptionEntity();
      // Type assertion to bypass TypeScript's type checking for testing
      entity.currentPeriodStart = null as unknown as Date;

      // Act & Assert
      expect(() => SubscriptionMapper.toDomain(entity)).toThrow(
        'DB constraint violation: currentPeriodStart cannot be null.',
      );
    });
  });

  describe('toPersistence', () => {
    it('should correctly map a valid Subscription domain object to a SubscriptionEntity', () => {
      // Arrange
      const domain = createMockSubscriptionDomain(faker.date.past()); // With a date

      // Act
      const entity = SubscriptionMapper.toPersistence(domain);

      // Assert
      expect(entity).toBeInstanceOf(SubscriptionEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.userId).toBe(domain.userId);
      expect(entity.stripeSubscriptionId).toBe(domain.stripeSubscriptionId);
      expect(entity.status).toBe(domain.status);
      expect(entity.currentPeriodEnd).toEqual(domain.currentPeriodEnd);
      expect(entity.cancelAtPeriodEnd).toBe(domain.cancelAtPeriodEnd);
      // createdAt and updatedAt are managed by TypeORM, not mapped back directly here
      expect(entity.stripeCustomerId).toBe(domain.stripeCustomerId);
      expect(entity.stripePriceId).toBe(domain.stripePriceId);
      expect(entity.currentPeriodStart).toEqual(domain.currentPeriodStart);
      expect(entity.canceledAt).toEqual(domain.canceledAt);
    });

    it('should map a null canceledAt from domain to null in entity', () => {
      // Arrange
      const domain = createMockSubscriptionDomain(null); // Explicitly null

      // Act
      const entity = SubscriptionMapper.toPersistence(domain);

      // Assert
      expect(entity.canceledAt).toBeNull();
    });

    it('should map an undefined canceledAt from domain to null in entity', () => {
      // Arrange
      const domain = createMockSubscriptionDomain(undefined); // Undefined

      // Act
      const entity = SubscriptionMapper.toPersistence(domain);

      // Assert
      expect(entity.canceledAt).toBeNull();
    });

    // Test potential null values from domain (should map to null in entity)
    it('should handle potentially null currentPeriodEnd in domain', () => {
      // Arrange
      const domain = createMockSubscriptionDomain();
      // Simulate potentially null value (though domain object logic should prevent this)
      const domainWithNull = {
        ...domain,
        currentPeriodEnd: null as unknown as Date,
      };

      // Act
      const entity = SubscriptionMapper.toPersistence(
        domainWithNull as Subscription,
      );

      // Assert
      expect(entity.currentPeriodEnd).toBeNull();
    });

    it('should handle potentially null cancelAtPeriodEnd in domain', () => {
      // Arrange
      const domain = createMockSubscriptionDomain();
      // Simulate potentially null value
      const domainWithNull = {
        ...domain,
        cancelAtPeriodEnd: null as unknown as boolean,
      };

      // Act
      const entity = SubscriptionMapper.toPersistence(
        domainWithNull as Subscription,
      );

      // Assert
      expect(entity.cancelAtPeriodEnd).toBeNull();
    });
  });
});
