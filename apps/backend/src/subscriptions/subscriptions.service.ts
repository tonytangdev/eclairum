import { Injectable, Logger } from '@nestjs/common';
import {
  SyncSubscriptionUseCase,
  SyncSubscriptionOutput,
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
      });

      this.logger.log(
        `Subscription synced successfully: ID ${subscription.getId()}`,
      );
      return subscription;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to sync subscription for user ${dto.userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
        { dto },
      );
      throw error;
    }
  }
}
