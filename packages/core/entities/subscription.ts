import { randomUUID } from "crypto";

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
  UNPAID = "unpaid",
}

export interface SubscriptionProps {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription implements SubscriptionProps {
  readonly id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.stripeCustomerId = props.stripeCustomerId;
    this.stripeSubscriptionId = props.stripeSubscriptionId;
    this.stripePriceId = props.stripePriceId;
    this.status = props.status;
    this.currentPeriodStart = props.currentPeriodStart;
    this.currentPeriodEnd = props.currentPeriodEnd;
    this.cancelAtPeriodEnd = props.cancelAtPeriodEnd;
    this.canceledAt = props.canceledAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(
    input: Omit<SubscriptionProps, "id" | "createdAt" | "updatedAt">,
  ): Subscription {
    const now = new Date();
    const props: SubscriptionProps = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    // Basic validation could go here if needed
    return new Subscription(props);
  }

  /**
   * Reconstructs a Subscription object from its properties, typically used
   * when loading from a data store.
   * @param props The complete properties of an existing subscription.
   * @returns A Subscription instance.
   */
  public static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  public updateStatus(status: SubscriptionStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  public cancelSubscription(
    cancelAtPeriodEnd: boolean,
    canceledAt?: Date,
  ): void {
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.canceledAt = canceledAt ?? new Date();
    if (!cancelAtPeriodEnd) {
      this.status = SubscriptionStatus.CANCELED;
    }
    this.updatedAt = new Date();
  }

  public updateBillingPeriod(start: Date, end: Date): void {
    this.currentPeriodStart = start;
    this.currentPeriodEnd = end;
    this.updatedAt = new Date();
  }

  public updatePrice(priceId: string): void {
    this.stripePriceId = priceId;
    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getUserId(): string {
    return this.userId;
  }

  // Add other methods as needed, e.g., for handling plan changes
}
