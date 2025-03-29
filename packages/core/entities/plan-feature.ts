import { RequiredFieldError } from "../errors/validation-errors";
import { Feature } from "./feature";
import { Plan } from "./plan";
import {
  InvalidLimitTypeError,
  InvalidNumericLimitValueError,
  InvalidBooleanLimitValueError,
  InvalidStorageLimitValueError,
  InvalidLimitTypeAccessError,
} from "../errors/plan-feature-errors";

/**
 * Represents the type of limit for a feature in a plan
 */
export enum LimitType {
  NUMERIC = "numeric",
  BOOLEAN = "boolean",
  STORAGE = "storage",
}

/**
 * Constructor parameters for creating a PlanFeature
 */
type PlanFeatureConstructor = {
  id?: string;
  planId: string;
  featureId: string;
  limitType: LimitType;
  limitValue: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Represents a feature associated with a subscription plan and its usage limits
 */
export class PlanFeature {
  private id: string;
  private planId: Plan["id"];
  private featureId: Feature["id"];
  private limitType: LimitType;
  private limitValue: string;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new PlanFeature
   * @param params PlanFeature parameters
   * @throws RequiredFieldError if required fields are missing or invalid
   * @throws Error if limitValue format doesn't match limitType
   */
  constructor({
    id = crypto.randomUUID(),
    planId,
    featureId,
    limitType,
    limitValue,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: PlanFeatureConstructor) {
    if (planId.trim() === "") {
      throw new RequiredFieldError("planId", "PlanFeature");
    }

    if (featureId.trim() === "") {
      throw new RequiredFieldError("featureId", "PlanFeature");
    }

    if (!Object.values(LimitType).includes(limitType)) {
      throw new InvalidLimitTypeError(limitType);
    }

    // Validate limit value based on limit type
    this.validateLimitValue(limitType, limitValue);

    this.id = id;
    this.planId = planId;
    this.featureId = featureId;
    this.limitType = limitType;
    this.limitValue = limitValue;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Gets the plan feature's unique identifier
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gets the associated plan ID
   */
  public getPlanId(): string {
    return this.planId;
  }

  /**
   * Gets the associated feature ID
   */
  public getFeatureId(): string {
    return this.featureId;
  }

  /**
   * Gets the limit type
   */
  public getLimitType(): LimitType {
    return this.limitType;
  }

  /**
   * Gets the limit value
   */
  public getLimitValue(): string {
    return this.limitValue;
  }

  /**
   * Gets the limit as a number if it's numeric; otherwise throws error
   */
  public getNumericLimit(): number {
    if (this.limitType !== LimitType.NUMERIC) {
      throw new InvalidLimitTypeAccessError("numeric", this.limitType);
    }

    return parseInt(this.limitValue, 10);
  }

  /**
   * Gets the limit as a boolean if it's boolean; otherwise throws error
   */
  public getBooleanLimit(): boolean {
    if (this.limitType !== LimitType.BOOLEAN) {
      throw new InvalidLimitTypeAccessError("boolean", this.limitType);
    }

    return this.limitValue.toLowerCase() === "true";
  }

  /**
   * Gets the storage limit in bytes if it's storage; otherwise throws error
   */
  public getStorageLimit(): number {
    if (this.limitType !== LimitType.STORAGE) {
      throw new InvalidLimitTypeAccessError("storage", this.limitType);
    }

    return parseInt(this.limitValue, 10);
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
   * Updates the limit type and value
   * @param limitType New limit type
   * @param limitValue New limit value
   */
  public updateLimit(limitType: LimitType, limitValue: string): void {
    if (!Object.values(LimitType).includes(limitType)) {
      throw new InvalidLimitTypeError(limitType);
    }

    // Validate limit value based on limit type
    this.validateLimitValue(limitType, limitValue);

    this.limitType = limitType;
    this.limitValue = limitValue;
    this.updatedAt = new Date();
  }

  /**
   * Sets the plan ID and updates the timestamp
   */
  public setPlanId(planId: string): void {
    if (planId.trim() === "") {
      throw new RequiredFieldError("planId", "PlanFeature");
    }

    this.planId = planId;
    this.updatedAt = new Date();
  }

  /**
   * Sets the feature ID and updates the timestamp
   */
  public setFeatureId(featureId: string): void {
    if (featureId.trim() === "") {
      throw new RequiredFieldError("featureId", "PlanFeature");
    }

    this.featureId = featureId;
    this.updatedAt = new Date();
  }

  /**
   * Validates that the limit value matches the expected format for the limit type
   */
  private validateLimitValue(limitType: LimitType, limitValue: string): void {
    if (limitValue.trim() === "") {
      throw new RequiredFieldError("limitValue", "PlanFeature");
    }

    switch (limitType) {
      case LimitType.NUMERIC:
        // Must be a valid number
        if (!/^\d+$/.test(limitValue)) {
          throw new InvalidNumericLimitValueError();
        }
        break;
      case LimitType.BOOLEAN:
        // Must be "true" or "false"
        if (
          limitValue.toLowerCase() !== "true" &&
          limitValue.toLowerCase() !== "false"
        ) {
          throw new InvalidBooleanLimitValueError();
        }
        break;
      case LimitType.STORAGE:
        // Must be a valid number (bytes)
        if (!/^\d+$/.test(limitValue)) {
          throw new InvalidStorageLimitValueError();
        }
        break;
      default:
        throw new InvalidLimitTypeError(limitType as string);
    }
  }

  /**
   * Creates a PlanFeature from Plan and Feature objects
   * @param plan The Plan object
   * @param feature The Feature object
   * @param limitType The limit type
   * @param limitValue The limit value
   * @returns A new PlanFeature instance
   */
  public static createFromPlanAndFeature(
    plan: Plan,
    feature: Feature,
    limitType: LimitType,
    limitValue: string,
  ): PlanFeature {
    return new PlanFeature({
      planId: plan.getId(),
      featureId: feature.getId(),
      limitType,
      limitValue,
    });
  }
}
