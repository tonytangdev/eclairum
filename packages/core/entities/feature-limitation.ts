import { InvalidFeatureLimitationError } from "../errors/feature-limitation-errors";

/**
 * Represents the types of limitations that can be applied to a feature
 */
export enum LimitationType {
  USAGE_COUNT = "USAGE_COUNT",
  TIME_BASED = "TIME_BASED",
  FEATURE_TOGGLE = "FEATURE_TOGGLE",
}

interface FeatureLimitationConstructor {
  id?: string;
  featureId: string;
  subscriptionPlanId: string;
  limitationType: LimitationType;
  maxUsage?: number | null;
  isEnabled?: boolean;
  timeLimit?: number | null; // in seconds
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * FeatureLimitation entity represents the constraints applied to a feature
 * for a specific subscription plan.
 */
export class FeatureLimitation {
  private readonly id: string;
  private readonly featureId: string;
  private readonly subscriptionPlanId: string;
  private limitationType: LimitationType;
  private maxUsage: number | null;
  private isEnabled: boolean;
  private timeLimit: number | null; // in seconds
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor({
    id = crypto.randomUUID(),
    featureId,
    subscriptionPlanId,
    limitationType,
    maxUsage = null,
    isEnabled = true,
    timeLimit = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
  }: FeatureLimitationConstructor) {
    this.id = id;
    this.featureId = featureId;
    this.subscriptionPlanId = subscriptionPlanId;
    this.limitationType = limitationType;

    // Validate maxUsage if the limitation type is USAGE_COUNT
    if (
      limitationType === LimitationType.USAGE_COUNT &&
      maxUsage !== null &&
      maxUsage <= 0
    ) {
      throw new InvalidFeatureLimitationError(
        "Max usage must be positive for USAGE_COUNT limitation type",
      );
    }
    this.maxUsage = maxUsage;

    // Validate timeLimit if the limitation type is TIME_BASED
    if (
      limitationType === LimitationType.TIME_BASED &&
      (timeLimit === null || timeLimit <= 0)
    ) {
      throw new InvalidFeatureLimitationError(
        "Time limit must be specified and positive for TIME_BASED limitation type",
      );
    }
    this.timeLimit = timeLimit;

    this.isEnabled = isEnabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getFeatureId(): string {
    return this.featureId;
  }

  public getSubscriptionPlanId(): string {
    return this.subscriptionPlanId;
  }

  public getLimitationType(): LimitationType {
    return this.limitationType;
  }

  public getMaxUsage(): number | null {
    return this.maxUsage;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getTimeLimit(): number | null {
    return this.timeLimit;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public setLimitationType(limitationType: LimitationType): void {
    this.limitationType = limitationType;
    this.updatedAt = new Date();
  }

  public setMaxUsage(maxUsage: number | null): void {
    if (
      this.limitationType === LimitationType.USAGE_COUNT &&
      maxUsage !== null &&
      maxUsage <= 0
    ) {
      throw new InvalidFeatureLimitationError(
        "Max usage must be positive for USAGE_COUNT limitation type",
      );
    }
    this.maxUsage = maxUsage;
    this.updatedAt = new Date();
  }

  public setIsEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
    this.updatedAt = new Date();
  }

  public setTimeLimit(timeLimit: number | null): void {
    if (
      this.limitationType === LimitationType.TIME_BASED &&
      (timeLimit === null || timeLimit <= 0)
    ) {
      throw new InvalidFeatureLimitationError(
        "Time limit must be specified and positive for TIME_BASED limitation type",
      );
    }
    this.timeLimit = timeLimit;
    this.updatedAt = new Date();
  }

  public setDeletedAt(deletedAt: Date | null): void {
    this.deletedAt = deletedAt;
    this.updatedAt = new Date();
  }

  public isUnlimited(): boolean {
    return this.limitationType === LimitationType.FEATURE_TOGGLE
      ? true
      : this.maxUsage === null && this.timeLimit === null;
  }
}
