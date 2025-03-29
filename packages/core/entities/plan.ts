import { RequiredFieldError } from "../errors/validation-errors";

/**
 * Represents billing intervals for subscription plans
 */
export enum BillingInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  QUARTERLY = "quarterly",
}

/**
 * Constructor parameters for creating a Plan
 */
type PlanConstructor = {
  id?: string;
  name: string;
  description?: string | null;
  priceAmount: number; // In cents
  priceCurrency?: string;
  billingInterval: BillingInterval;
  isActive?: boolean;
  trialDays?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

/**
 * Represents a subscription plan in the system
 */
export class Plan {
  private id: string;
  private name: string;
  private description: string | null;
  private priceAmount: number;
  private priceCurrency: string;
  private billingInterval: BillingInterval;
  private isActive: boolean;
  private trialDays: number;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  /**
   * Creates a new Plan
   * @param params Plan parameters
   * @throws RequiredFieldError if required fields are missing or invalid
   */
  constructor({
    id = crypto.randomUUID(),
    name,
    description = null,
    priceAmount,
    priceCurrency = "USD",
    billingInterval,
    isActive = true,
    trialDays = 0,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
  }: PlanConstructor) {
    if (!name || name.trim() === "") {
      throw new RequiredFieldError("name", "Plan");
    }

    if (priceAmount < 0) {
      throw new Error("Price amount cannot be negative");
    }

    if (trialDays < 0) {
      throw new Error("Trial days cannot be negative");
    }

    if (!Object.values(BillingInterval).includes(billingInterval)) {
      throw new Error(`Invalid billing interval: ${billingInterval}`);
    }

    this.id = id;
    this.name = name;
    this.description = description;
    this.priceAmount = priceAmount;
    this.priceCurrency = priceCurrency.toUpperCase();
    this.billingInterval = billingInterval;
    this.isActive = isActive;
    this.trialDays = trialDays;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  /**
   * Gets the plan's unique identifier
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gets the plan's name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Gets the plan's description
   */
  public getDescription(): string | null {
    return this.description;
  }

  /**
   * Gets the price amount in cents
   */
  public getPriceAmount(): number {
    return this.priceAmount;
  }

  /**
   * Gets the price formatted as a string with currency symbol
   */
  public getFormattedPrice(): string {
    return `${(this.priceAmount / 100).toFixed(2)} ${this.priceCurrency}`;
  }

  /**
   * Gets the price currency
   */
  public getPriceCurrency(): string {
    return this.priceCurrency;
  }

  /**
   * Gets the billing interval
   */
  public getBillingInterval(): BillingInterval {
    return this.billingInterval;
  }

  /**
   * Checks if the plan is active
   */
  public isCurrentlyActive(): boolean {
    return this.isActive && this.deletedAt === null;
  }

  /**
   * Gets the trial period in days
   */
  public getTrialDays(): number {
    return this.trialDays;
  }

  /**
   * Gets the plan's creation date
   */
  public getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the plan's last update date
   */
  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Gets the plan's deletion date
   */
  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  /**
   * Checks if the plan is deleted
   */
  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Sets the plan's name and updates the timestamp
   */
  public setName(name: string): void {
    if (!name || name.trim() === "") {
      throw new RequiredFieldError("name", "Plan");
    }

    this.name = name;
    this.updatedAt = new Date();
  }

  /**
   * Sets the plan's description and updates the timestamp
   */
  public setDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Sets the plan's price and updates the timestamp
   */
  public setPriceAmount(amount: number): void {
    if (amount < 0) {
      throw new Error("Price amount cannot be negative");
    }

    this.priceAmount = amount;
    this.updatedAt = new Date();
  }

  /**
   * Sets the plan's billing interval and updates the timestamp
   */
  public setBillingInterval(interval: BillingInterval): void {
    this.billingInterval = interval;
    this.updatedAt = new Date();
  }

  /**
   * Sets the trial period in days and updates the timestamp
   */
  public setTrialDays(days: number): void {
    if (days < 0) {
      throw new Error("Trial days cannot be negative");
    }

    this.trialDays = days;
    this.updatedAt = new Date();
  }

  /**
   * Activates the plan and updates the timestamp
   */
  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivates the plan and updates the timestamp
   */
  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Soft deletes the plan and updates the timestamp
   */
  public softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Restores a deleted plan and updates the timestamp
   */
  public restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }
}
