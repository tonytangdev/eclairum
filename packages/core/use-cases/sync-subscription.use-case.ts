import { Subscription, SubscriptionStatus } from "../entities/subscription";
import { type PaymentGateway } from "../interfaces/payment-gateway.interface";
import { type SubscriptionRepository } from "../interfaces/subscription-repository.interface";
import { type UserRepository } from "../interfaces/user-repository.interface";

/**
 * Input for synchronizing an existing Stripe subscription.
 */
export interface SyncSubscriptionInput {
  userId: string;
  stripeSubscriptionId: string; // The existing Stripe subscription ID
  stripeCustomerId?: string; // The Stripe customer ID (optional, but preferred if known, e.g., from webhook)
}

// Output remains the created/synchronized Subscription entity
export type SyncSubscriptionOutput = Subscription;

/**
 * Use case to synchronize an existing Stripe subscription with the local database.
 */
export class SyncSubscriptionUseCase {
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

    let expectedStripeCustomerId: string;

    // 2. Determine the expected Stripe Customer ID
    if (input.stripeCustomerId) {
      // Use the customer ID provided from the input (e.g., webhook)
      expectedStripeCustomerId = input.stripeCustomerId;
      console.log(
        `Using provided Stripe Customer ID: ${expectedStripeCustomerId} for user ${input.userId}`,
      );
      // Optional: Ensure metadata is set on this customer
      // You might want a separate gateway method like `updateCustomerMetadata`
      // or rely on findOrCreateCustomer's creation logic if it were called.
      // For simplicity here, we'll assume the metadata might be missing
      // but prioritize using the correct customer ID.
      // Consider calling findOrCreateCustomer just to ensure metadata if needed:
      // await this.paymentGateway.findOrCreateCustomer({ userId: user.getId(), email: user.getEmail(), name: user.getName() });
    } else {
      // Fallback: Find or create customer if ID wasn't provided
      console.warn(
        `Stripe Customer ID not provided for user ${input.userId}. Falling back to findOrCreateCustomer.`,
      );
      const customerResult = await this.paymentGateway.findCustomerByUserId(
        user.getId(),
      );

      if (!customerResult) {
        console.error(`No Stripe Customer ID found for user ${input.userId}.`);
        throw new Error(
          `No Stripe Customer ID found for user ${input.userId}.`,
        );
      }

      expectedStripeCustomerId = customerResult.customerId;
    }

    // 3. Fetch the existing subscription details from Stripe
    const gatewaySubscription = await this.paymentGateway.getSubscription(
      input.stripeSubscriptionId,
    );

    // 4. **Validation:** Ensure the fetched subscription belongs to the correct customer
    if (gatewaySubscription.customerId !== expectedStripeCustomerId) {
      // Log details for security/debugging
      console.error(
        `Subscription mismatch: User ${input.userId} tried to sync Stripe subscription ${input.stripeSubscriptionId} which belongs to Stripe customer ${gatewaySubscription.customerId}, but the user should be linked to ${expectedStripeCustomerId}.`,
      );
      throw new Error(
        `Subscription ${input.stripeSubscriptionId} does not belong to the specified user or the expected customer.`,
      );
    }

    // 5. Map gateway status to our internal status
    const status = this.mapGatewayStatusToSubscriptionStatus(
      gatewaySubscription.status,
    );

    // 6. Create or Update
    let subscription =
      await this.subscriptionRepository.findByStripeSubscriptionId(
        gatewaySubscription.subscriptionId,
      );

    if (subscription) {
      subscription.updateStatus(status);
      subscription.updateBillingPeriod(
        gatewaySubscription.currentPeriodStart,
        gatewaySubscription.currentPeriodEnd,
      );
      subscription.updatePrice(gatewaySubscription.priceId);
      // Add other updates as necessary
    } else {
      subscription = Subscription.create({
        userId: user.getId(),
        stripeCustomerId: gatewaySubscription.customerId, // Use customerId from fetched subscription
        stripeSubscriptionId: gatewaySubscription.subscriptionId,
        stripePriceId: gatewaySubscription.priceId,
        status,
        currentPeriodStart: gatewaySubscription.currentPeriodStart,
        currentPeriodEnd: gatewaySubscription.currentPeriodEnd,
        cancelAtPeriodEnd: gatewaySubscription.cancelAtPeriodEnd,
        canceledAt: null,
      });
    }

    // 7. Save the subscription (create or update)
    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    // 8. Return the saved/updated subscription
    return savedSubscription;
  }

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
