import { Subscription } from '@eclairum/core/entities';
import { SubscriptionEntity } from '../../../common/entities/subscription.entity';

export class SubscriptionMapper {
  static toDomain(entity: SubscriptionEntity): Subscription {
    if (!entity) {
      throw new Error('Cannot map null or undefined entity to domain.');
    }

    // Validate required fields that are nullable in the entity but not in the domain
    if (entity.currentPeriodEnd === null) {
      throw new Error(
        'DB constraint violation: currentPeriodEnd cannot be null.',
      );
    }
    if (entity.cancelAtPeriodEnd === null) {
      throw new Error(
        'DB constraint violation: cancelAtPeriodEnd cannot be null.',
      );
    }
    // currentPeriodStart is required in domain, ensure it's not null (though entity schema doesn't allow null)
    if (entity.currentPeriodStart === null) {
      throw new Error(
        'DB constraint violation: currentPeriodStart cannot be null.',
      );
    }

    return Subscription.reconstitute({
      id: entity.id,
      userId: entity.userId,
      stripeSubscriptionId: entity.stripeSubscriptionId,
      status: entity.status,
      currentPeriodEnd: entity.currentPeriodEnd,
      cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      stripeCustomerId: entity.stripeCustomerId,
      stripePriceId: entity.stripePriceId,
      currentPeriodStart: entity.currentPeriodStart,
      canceledAt: entity.canceledAt ?? undefined,
    });
  }

  static toPersistence(subscription: Subscription): SubscriptionEntity {
    const entity = new SubscriptionEntity();
    entity.id = subscription.id;
    entity.userId = subscription.userId;
    entity.stripeSubscriptionId = subscription.stripeSubscriptionId;
    entity.status = subscription.status;
    entity.currentPeriodEnd = subscription.currentPeriodEnd ?? null;
    entity.cancelAtPeriodEnd = subscription.cancelAtPeriodEnd ?? null;
    entity.stripeCustomerId = subscription.stripeCustomerId;
    entity.stripePriceId = subscription.stripePriceId;
    entity.currentPeriodStart = subscription.currentPeriodStart;
    entity.canceledAt = subscription.canceledAt ?? null;
    return entity;
  }
}
