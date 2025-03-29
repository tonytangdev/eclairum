import { User } from "./user";
import { Feature } from "./feature";
import { RequiredFieldError } from "../errors/validation-errors";
import {
  InvalidResetDateError,
  InvalidUsageAmountError,
  NegativeLimitError,
  NegativeUsageCountError,
} from "../errors/feature-usage-errors";

/**
 * Constructor parameters for creating a FeatureUsage
 */
type FeatureUsageConstructor = {
  id?: string;
  userId: User["id"];
  featureId: Feature["id"];
  usageCount?: number;
  resetAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Represents a user's usage of a specific feature
 * Tracks usage count against limits defined in a subscription plan
 */
export class FeatureUsage {
  private id: string;
  private userId: User["id"];
  private featureId: Feature["id"];
  private usageCount: number;
  private resetAt: Date;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new FeatureUsage
   * @param params FeatureUsage parameters
   * @throws RequiredFieldError if required fields are missing or invalid
   */
  constructor({
    id = crypto.randomUUID(),
    userId,
    featureId,
    usageCount = 0,
    resetAt,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: FeatureUsageConstructor) {
    if (userId.trim() === "") {
      throw new RequiredFieldError("userId", "FeatureUsage");
    }

    if (featureId.trim() === "") {
      throw new RequiredFieldError("featureId", "FeatureUsage");
    }

    if (usageCount < 0) {
      throw new NegativeUsageCountError();
    }

    if (!resetAt) {
      throw new RequiredFieldError("resetAt", "FeatureUsage");
    }

    this.id = id;
    this.userId = userId;
    this.featureId = featureId;
    this.usageCount = usageCount;
    this.resetAt = resetAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Gets the feature usage's unique identifier
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
   * Gets the associated feature ID
   */
  public getFeatureId(): string {
    return this.featureId;
  }

  /**
   * Gets the current usage count
   */
  public getUsageCount(): number {
    return this.usageCount;
  }

  /**
   * Gets the date when usage resets
   */
  public getResetAt(): Date {
    return this.resetAt;
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
   * Increments usage count by the specified amount
   * @param amount Amount to increment (defaults to 1)
   */
  public incrementUsage(amount = 1): void {
    if (amount <= 0) {
      throw new InvalidUsageAmountError("Increment");
    }

    this.usageCount += amount;
    this.updatedAt = new Date();
  }

  /**
   * Decrements usage count by the specified amount, but not below zero
   * @param amount Amount to decrement (defaults to 1)
   */
  public decrementUsage(amount = 1): void {
    if (amount <= 0) {
      throw new InvalidUsageAmountError("Decrement");
    }

    this.usageCount = Math.max(0, this.usageCount - amount);
    this.updatedAt = new Date();
  }

  /**
   * Resets the usage count to zero
   */
  public resetUsage(): void {
    this.usageCount = 0;
    this.updatedAt = new Date();
  }

  /**
   * Updates the reset date
   * @param resetAt New reset date
   */
  public updateResetDate(resetAt: Date): void {
    if (!resetAt) {
      throw new InvalidResetDateError();
    }

    this.resetAt = resetAt;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the usage has expired (current date is past reset date)
   */
  public isExpired(): boolean {
    const now = new Date();
    return now >= this.resetAt;
  }

  /**
   * Checks if the usage count is below the specified limit
   * @param limit Maximum allowed usage
   */
  public isWithinLimit(limit: number): boolean {
    return this.usageCount < limit;
  }

  /**
   * Returns the remaining usage allowed within the specified limit
   * @param limit Maximum allowed usage
   */
  public getRemainingUsage(limit: number): number {
    if (limit < 0) {
      throw new NegativeLimitError();
    }

    return Math.max(0, limit - this.usageCount);
  }
}
