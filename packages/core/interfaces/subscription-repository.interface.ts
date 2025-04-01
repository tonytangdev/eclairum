import { type Subscription } from "../entities/subscription";

export interface SubscriptionRepository {
  save(subscription: Subscription): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  findByUserId(userId: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<Subscription | null>;
  findActiveByUserId(userId: string): Promise<Subscription | null>;
  // Add other necessary methods later
}
