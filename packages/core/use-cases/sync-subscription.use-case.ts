import { Subscription, SubscriptionStatus } from "../entities/subscription";
import { type PaymentGateway } from "../interfaces/payment-gateway.interface";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import { type UserRepository } from "../interfaces/user-repository.interface";

/**
 * Input for synchronizing an existing Stripe subscription.
 */
export interface SyncSubscriptionInput {
  userId: string;
  stripeSubscriptionId: string; // We now need the existing Stripe subscription ID
}

// Output remains the created/synchronized Subscription entity
export type SyncSubscriptionOutput = Subscription;

/**
 * Use case to synchronize an existing Stripe subscription with the local database.
 */
export class SyncSubscriptionUseCase {
  // Renamed class for clarity
  constructor(
    private readonly userRepository: UserRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async execute(input: SyncSubscriptionInput): Promise<SyncSubscriptionOutput> {
    // 1. Find the user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error(`User with ID ${input.userId} not found.`);
    }

    // 2. Ensure customer exists in Stripe and get their Stripe Customer ID
    // This links our user to a Stripe customer if not already done.
    const customerName = user.getEmail().split("@")[0];
    const { customerId: expectedStripeCustomerId } =
      await this.paymentGateway.findOrCreateCustomer({
        email: user.getEmail(),
        name: customerName,
        userId: user.getId(),
      });

    // 3. Fetch the existing subscription details from Stripe
    const gatewaySubscription = await this.paymentGateway.getSubscription(
      input.stripeSubscriptionId,
    );

    // 4. **Validation:** Ensure the fetched subscription belongs to the correct customer
    if (gatewaySubscription.customerId !== expectedStripeCustomerId) {
      // Log details for security/debugging
      console.error(
        `Subscription mismatch: User ${input.userId} tried to sync Stripe subscription ${input.stripeSubscriptionId} which belongs to Stripe customer ${gatewaySubscription.customerId}, but the user is linked to ${expectedStripeCustomerId}.`,
      );
      throw new Error(
        `Subscription ${input.stripeSubscriptionId} does not belong to the specified user.`,
      );
    }

    // 5. Map gateway status to our internal status
    const status = this.mapGatewayStatusToSubscriptionStatus(
      gatewaySubscription.status,
    );

    // 6. Create or Update? For now, let's assume creating if not found by stripeId.
    // A more robust implementation might check if a record with this stripeSubscriptionId
    // already exists and update it instead.
    let subscription =
      await this.subscriptionRepository.findByStripeSubscriptionId(
        gatewaySubscription.subscriptionId,
      );

    if (subscription) {
      // Optionally update existing record fields if needed
      // For example, update status, period dates etc. based on gatewaySubscription
      subscription.updateStatus(status);
      subscription.updateBillingPeriod(
        gatewaySubscription.currentPeriodStart,
        gatewaySubscription.currentPeriodEnd,
      );
      subscription.updatePrice(gatewaySubscription.priceId);
      // Add other updates as necessary
    } else {
      // Create new subscription entity if it doesn't exist locally
      subscription = Subscription.create({
        userId: user.getId(),
        stripeCustomerId: gatewaySubscription.customerId, // Use customerId from fetched subscription
        stripeSubscriptionId: gatewaySubscription.subscriptionId,
        stripePriceId: gatewaySubscription.priceId,
        status,
        currentPeriodStart: gatewaySubscription.currentPeriodStart,
        currentPeriodEnd: gatewaySubscription.currentPeriodEnd,
        cancelAtPeriodEnd: gatewaySubscription.cancelAtPeriodEnd,
        canceledAt: null, // Assume not canceled unless status indicates otherwise
      });
    }

    // 7. Save the subscription (create or update)
    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // 8. Return the saved/updated subscription
    return savedSubscription;
  }

  // Helper function remains the same
  private mapGatewayStatusToSubscriptionStatus(
    gatewayStatus: string,
  ): SubscriptionStatus {
    switch (gatewayStatus.toLowerCase()) {
      case "active":
      case "trialing":
        return SubscriptionStatus.ACTIVE;
      case "past_due":
        return SubscriptionStatus.PAST_DUE;
      case "canceled":
        return SubscriptionStatus.CANCELED;
      case "unpaid":
        return SubscriptionStatus.UNPAID;
      case "incomplete":
        return SubscriptionStatus.INCOMPLETE;
      case "incomplete_expired":
        return SubscriptionStatus.INCOMPLETE_EXPIRED;
      default:
        console.warn(
          `Unknown subscription status from gateway: ${gatewayStatus}`,
        );
        return SubscriptionStatus.INCOMPLETE;
    }
  }
}
