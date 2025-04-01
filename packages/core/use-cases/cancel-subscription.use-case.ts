import { Subscription, SubscriptionStatus } from "../entities/subscription";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import { type UserRepository } from "../interfaces/user-repository.interface";

/**
 * Input for canceling a subscription.
 */
export interface CancelSubscriptionInput {
  userId: string;
  cancelAtPeriodEnd: boolean;
}

/**
 * Output for the cancel subscription use case.
 */
export type CancelSubscriptionOutput = Subscription;

/**
 * Use case to cancel a user's subscription.
 * This use case handles both immediate cancellation and cancellation at the end of the billing period.
 * Note: This use case only updates the local domain state. The actual cancellation in Stripe
 * is handled via webhooks, which will trigger this use case.
 */
export class CancelSubscriptionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(
    input: CancelSubscriptionInput,
  ): Promise<CancelSubscriptionOutput> {
    // 1. Find the user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error(`User with ID ${input.userId} not found.`);
    }

    // 2. Find the user's active subscription
    const subscription = await this.subscriptionRepository.findActiveByUserId(
      input.userId,
    );

    if (!subscription) {
      throw new Error(`No active subscription found for user ${input.userId}.`);
    }

    // 3. Validate subscription can be canceled
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new Error(
        `Subscription ${subscription.id} is not active and cannot be canceled. Current status: ${subscription.status}`,
      );
    }

    // 4. Update the subscription in our domain
    subscription.cancelSubscription(input.cancelAtPeriodEnd);

    // 5. Save the updated subscription
    const updatedSubscription =
      await this.subscriptionRepository.save(subscription);

    // 6. Return the updated subscription
    return updatedSubscription;
  }
}
