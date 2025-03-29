import { User } from "./user";
import { Plan } from "./plan";
import { RequiredFieldError } from "../errors/validation-errors";

/**
 * Represents subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
}

/**
 * Constructor parameters for creating a Subscription
 */
type SubscriptionConstructor = {
  id?: string;
  userId: User["id"];
  planId: Plan["id"];
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date | null;
  trialEnd?: Date | null;
  canceledAt?: Date | null;
  paymentProvider?: string | null;
  providerSubscriptionId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Represents a user subscription to a plan
 */
export class Subscription {
  private id: string;
  private userId: User["id"];
  private planId: Plan["id"];
  private status: SubscriptionStatus;
  private currentPeriodStart: Date;
  private currentPeriodEnd: Date;
  private cancelAtPeriodEnd: boolean;
  private trialStart: Date | null;
  private trialEnd: Date | null;
  private canceledAt: Date | null;
  private paymentProvider: string | null;
  private providerSubscriptionId: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new Subscription
   * @param params Subscription parameters
   * @throws RequiredFieldError if required fields are missing or invalid
   */
  constructor({
    id = crypto.randomUUID(),
    userId,
    planId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd = false,
    trialStart = null,
    trialEnd = null,
    canceledAt = null,
    paymentProvider = null,
    providerSubscriptionId = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: SubscriptionConstructor) {
    if (userId.trim() === "") {
      throw new RequiredFieldError("userId", "Subscription");
    }

    if (planId.trim() === "") {
      throw new RequiredFieldError("planId", "Subscription");
    }

    if (!Object.values(SubscriptionStatus).includes(status)) {
      throw new Error(`Invalid subscription status: ${status}`);
    }

    // Validate that currentPeriodEnd is after currentPeriodStart
    if (currentPeriodEnd < currentPeriodStart) {
      throw new Error("Current period end must be after current period start");
    }

    // Validate trial dates if both are provided
    if (trialStart && trialEnd && trialEnd < trialStart) {
      throw new Error("Trial end must be after trial start");
    }

    this.id = id;
    this.userId = userId;
    this.planId = planId;
    this.status = status;
    this.currentPeriodStart = currentPeriodStart;
    this.currentPeriodEnd = currentPeriodEnd;
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.trialStart = trialStart;
    this.trialEnd = trialEnd;
    this.canceledAt = canceledAt;
    this.paymentProvider = paymentProvider;
    this.providerSubscriptionId = providerSubscriptionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Gets the subscription's unique identifier
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gets the associated user ID
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Gets the associated plan ID
   */
  public getPlanId(): string {
    return this.planId;
  }

  /**
   * Gets the subscription status
   */
  public getStatus(): SubscriptionStatus {
    return this.status;
  }

  /**
   * Gets the current period start date
   */
  public getCurrentPeriodStart(): Date {
    return this.currentPeriodStart;
  }

  /**
   * Gets the current period end date
   */
  public getCurrentPeriodEnd(): Date {
    return this.currentPeriodEnd;
  }

  /**
   * Gets whether the subscription is set to cancel at the end of the period
   */
  public willCancelAtPeriodEnd(): boolean {
    return this.cancelAtPeriodEnd;
  }

  /**
   * Gets the trial start date if applicable
   */
  public getTrialStart(): Date | null {
    return this.trialStart;
  }

  /**
   * Gets the trial end date if applicable
   */
  public getTrialEnd(): Date | null {
    return this.trialEnd;
  }

  /**
   * Gets the cancellation date if applicable
   */
  public getCanceledAt(): Date | null {
    return this.canceledAt;
  }

  /**
   * Gets the payment provider name if applicable
   */
  public getPaymentProvider(): string | null {
    return this.paymentProvider;
  }

  /**
   * Gets the provider-specific subscription ID if applicable
   */
  public getProviderSubscriptionId(): string | null {
    return this.providerSubscriptionId;
  }

  /**
   * Gets the creation date
   */
  public getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update date
   */
  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Updates the subscription status and updates the timestamp
   */
  public updateStatus(status: SubscriptionStatus): void {
    if (!Object.values(SubscriptionStatus).includes(status)) {
      throw new Error(`Invalid subscription status: ${status}`);
    }

    this.status = status;
    this.updatedAt = new Date();
  }

  /**
   * Sets the plan ID and updates the timestamp
   */
  public setPlanId(planId: string): void {
    if (planId.trim() === "") {
      throw new RequiredFieldError("planId", "Subscription");
    }

    this.planId = planId;
    this.updatedAt = new Date();
  }

  /**
   * Updates the current period dates and updates the timestamp
   * @param start New period start date
   * @param end New period end date
   */
  public updateCurrentPeriod(start: Date, end: Date): void {
    if (end < start) {
      throw new Error("Current period end must be after current period start");
    }

    this.currentPeriodStart = start;
    this.currentPeriodEnd = end;
    this.updatedAt = new Date();
  }

  /**
   * Sets whether to cancel at period end and updates the timestamp
   */
  public setCancelAtPeriodEnd(cancelAtPeriodEnd: boolean): void {
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.updatedAt = new Date();
  }

  /**
   * Updates the trial period dates and updates the timestamp
   * @param start Trial start date
   * @param end Trial end date
   */
  public setTrialPeriod(start: Date | null, end: Date | null): void {
    if (start && end && end < start) {
      throw new Error("Trial end must be after trial start");
    }

    this.trialStart = start;
    this.trialEnd = end;
    this.updatedAt = new Date();
  }

  /**
   * Cancels the subscription and updates the timestamp
   */
  public cancel(): void {
    this.status = SubscriptionStatus.CANCELED;
    this.canceledAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Sets the payment provider information and updates the timestamp
   */
  public setPaymentProvider(
    provider: string | null,
    providerSubscriptionId: string | null,
  ): void {
    this.paymentProvider = provider;
    this.providerSubscriptionId = providerSubscriptionId;
    this.updatedAt = new Date();
  }

  /**
   * Checks if subscription is currently in trial period
   */
  public isInTrial(): boolean {
    if (!this.trialStart || !this.trialEnd) {
      return false;
    }

    const now = new Date();
    return now >= this.trialStart && now <= this.trialEnd;
  }

  /**
   * Checks if subscription is currently active (status is active or trialing)
   */
  public isActive(): boolean {
    return (
      this.status === SubscriptionStatus.ACTIVE ||
      this.status === SubscriptionStatus.TRIALING
    );
  }
}
