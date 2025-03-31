import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  SyncSubscriptionUseCase,
  SyncSubscriptionOutput,
  FetchUserSubscriptionUseCase,
} from '@eclairum/core/use-cases';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';
import { StripeService } from './stripe.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { SubscriptionRepositoryImpl } from '../repositories/subscriptions/subscription.repository';
import { Subscription } from '@eclairum/core/entities';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly subscriptionRepository: SubscriptionRepositoryImpl,
    private readonly paymentGateway: StripeService,
  ) {}

  async sync(dto: SyncSubscriptionDto): Promise<SyncSubscriptionOutput> {
    this.logger.log(
      `Syncing subscription for user: ${dto.userId}, Stripe ID: ${dto.stripeSubscriptionId}`,
    );

    try {
      const syncUseCase = new SyncSubscriptionUseCase(
        this.userRepository,
        this.subscriptionRepository,
        this.paymentGateway,
      );

      const subscription: Subscription = await syncUseCase.execute({
        userId: dto.userId,
        stripeSubscriptionId: dto.stripeSubscriptionId,
        stripeCustomerId: dto.stripeCustomerId,
      });

      this.logger.log(
        `Subscription synced successfully: ID ${subscription.getId()}`,
      );
      return subscription;
    } catch (error: unknown) {
      const errorMessage = (error as Error).message;
      this.logger.error(
        `Failed to sync subscription for user ${dto.userId}: ${errorMessage}`,
        (error as Error).stack,
        { dto },
      );
      throw error;
    }
  }

  async fetchForUser(userId: string): Promise<Subscription | null> {
    this.logger.log(`Fetching subscription for user: ${userId}`);

    try {
      const fetchUseCase = new FetchUserSubscriptionUseCase(
        this.userRepository,
        this.subscriptionRepository,
      );

      const subscription = await fetchUseCase.execute({ userId });

      if (subscription) {
        this.logger.log(
          `Subscription found for user ${userId}: ID ${subscription.getId()}`,
        );
      } else {
        this.logger.log(`No active subscription found for user ${userId}.`);
      }
      return subscription;
    } catch (error: unknown) {
      const typedError = error as Error;
      if (typedError.message.includes('User with ID')) {
        this.logger.warn(
          `User not found when fetching subscription: ${userId}`,
        );
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      this.logger.error(
        `Failed to fetch subscription for user ${userId}: ${typedError.message}`,
        typedError.stack,
      );
      throw error;
    }
  }
}
