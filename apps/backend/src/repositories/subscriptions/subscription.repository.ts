import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionRepository } from '@eclairum/core/interfaces/subscription-repository.interface';
import { Subscription, SubscriptionStatus } from '@eclairum/core/entities';
import { SubscriptionEntity } from '../../common/entities/subscription.entity';
import { SubscriptionMapper } from './mappers/subscription.mapper';

@Injectable()
export class SubscriptionRepositoryImpl implements SubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  async save(subscription: Subscription): Promise<Subscription> {
    const entity = SubscriptionMapper.toPersistence(subscription);
    const savedEntity = await this.subscriptionRepository.save(entity);
    return SubscriptionMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: { id },
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: { userId },
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Subscription | null> {
    const entity = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }
}
