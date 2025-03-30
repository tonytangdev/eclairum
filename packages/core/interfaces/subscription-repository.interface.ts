import { type Subscription } from "../entities/subscription";

export interface SubscriptionRepository {
  save(subscription: Subscription): Promise<Subscription>;
  findByUserId(userId: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeId: string): Promise<Subscription | null>;
  // Add other necessary methods later
}
