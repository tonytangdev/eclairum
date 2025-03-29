import { User } from "./user";
import { RequiredFieldError } from "../errors/validation-errors";
import {
  InvalidCardDetailsError,
  InvalidProviderError,
  InvalidProviderIdError,
} from "../errors/payment-method-errors";

/**
 * Represents different payment method types
 */
export enum PaymentMethodType {
  CARD = "card",
  BANK_ACCOUNT = "bank_account",
  DIGITAL_WALLET = "digital_wallet",
}

/**
 * Represents different payment providers
 */
export enum PaymentProvider {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  BRAINTREE = "braintree",
}

/**
 * Constructor parameters for creating a PaymentMethod
 */
type PaymentMethodConstructor = {
  id?: string;
  userId: User["id"];
  provider: string;
  providerPaymentMethodId: string;
  type: PaymentMethodType;
  isDefault?: boolean;
  lastFour?: string | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  cardBrand?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Represents a payment method associated with a user
 */
export class PaymentMethod {
  private id: string;
  private userId: User["id"];
  private provider: string;
  private providerPaymentMethodId: string;
  private type: PaymentMethodType;
  private isDefault: boolean;
  private lastFour: string | null;
  private expiryMonth: string | null;
  private expiryYear: string | null;
  private cardBrand: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new PaymentMethod
   * @param params PaymentMethod parameters
   * @throws RequiredFieldError, InvalidCardDetailsError, InvalidPaymentMethodTypeError, InvalidProviderError
   */
  constructor({
    id = crypto.randomUUID(),
    userId,
    provider,
    providerPaymentMethodId,
    type,
    isDefault = false,
    lastFour = null,
    expiryMonth = null,
    expiryYear = null,
    cardBrand = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: PaymentMethodConstructor) {
    if (userId.trim() === "") {
      throw new RequiredFieldError("userId", "PaymentMethod");
    }

    if (provider.trim() === "") {
      throw new InvalidProviderError(provider);
    }

    if (providerPaymentMethodId.trim() === "") {
      throw new InvalidProviderIdError();
    }

    // Validate card details if this is a card payment method
    if (type === PaymentMethodType.CARD) {
      if (lastFour !== null && !/^\d{4}$/.test(lastFour)) {
        throw new InvalidCardDetailsError(
          "last four digits must be exactly 4 digits",
        );
      }

      if (expiryMonth !== null) {
        if (!/^\d{1,2}$/.test(expiryMonth)) {
          throw new InvalidCardDetailsError(
            "expiry month must be 1 or 2 digits",
          );
        }

        const monthNum = parseInt(expiryMonth, 10);
        if (monthNum < 1 || monthNum > 12) {
          throw new InvalidCardDetailsError(
            "expiry month must be between 1 and 12",
          );
        }
      }

      if (expiryYear !== null && !/^\d{4}$/.test(expiryYear)) {
        throw new InvalidCardDetailsError("expiry year must be 4 digits");
      }
    }

    this.id = id;
    this.userId = userId;
    this.provider = provider;
    this.providerPaymentMethodId = providerPaymentMethodId;
    this.type = type;
    this.isDefault = isDefault;
    this.lastFour = lastFour;
    this.expiryMonth = expiryMonth;
    this.cardBrand = cardBrand;
    this.expiryYear = expiryYear;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Gets the payment method's unique identifier
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
   * Gets the payment provider
   */
  public getProvider(): string {
    return this.provider;
  }

  /**
   * Gets the provider-specific payment method ID
   */
  public getProviderPaymentMethodId(): string {
    return this.providerPaymentMethodId;
  }

  /**
   * Gets the payment method type
   */
  public getType(): string {
    return this.type;
  }

  /**
   * Checks if this is the default payment method
   */
  public isDefaultMethod(): boolean {
    return this.isDefault;
  }

  /**
   * Sets this payment method as default or not
   */
  public setAsDefault(isDefault: boolean): void {
    this.isDefault = isDefault;
    this.updatedAt = new Date();
  }

  /**
   * Gets the last four digits if available
   */
  public getLastFour(): string | null {
    return this.lastFour;
  }

  /**
   * Gets the expiry month if available
   */
  public getExpiryMonth(): string | null {
    return this.expiryMonth;
  }

  /**
   * Gets the expiry year if available
   */
  public getExpiryYear(): string | null {
    return this.expiryYear;
  }

  /**
   * Gets the card brand if available
   */
  public getCardBrand(): string | null {
    return this.cardBrand;
  }

  /**
   * Gets formatted expiry date as MM/YY if available
   */
  public getFormattedExpiry(): string | null {
    if (!this.expiryMonth || !this.expiryYear) {
      return null;
    }

    // Ensure month is padded to 2 digits
    const month = this.expiryMonth.padStart(2, "0");
    // Use only last 2 digits of year
    const year = this.expiryYear.slice(-2);

    return `${month}/${year}`;
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
   * Updates card details and updates the timestamp
   */
  public updateCardDetails(
    lastFour: string | null,
    expiryMonth: string | null,
    expiryYear: string | null,
    cardBrand: string | null,
  ): void {
    if (this.type !== PaymentMethodType.CARD) {
      throw new InvalidCardDetailsError(
        "cannot update card details for non-card payment method",
      );
    }

    if (lastFour !== null && !/^\d{4}$/.test(lastFour)) {
      throw new InvalidCardDetailsError(
        "last four digits must be exactly 4 digits",
      );
    }

    if (expiryMonth !== null) {
      if (!/^\d{1,2}$/.test(expiryMonth)) {
        throw new InvalidCardDetailsError("expiry month must be 1 or 2 digits");
      }

      const monthNum = parseInt(expiryMonth, 10);
      if (monthNum < 1 || monthNum > 12) {
        throw new InvalidCardDetailsError(
          "expiry month must be between 1 and 12",
        );
      }
    }

    if (expiryYear !== null && !/^\d{4}$/.test(expiryYear)) {
      throw new InvalidCardDetailsError("expiry year must be 4 digits");
    }

    this.lastFour = lastFour;
    this.expiryMonth = expiryMonth;
    this.expiryYear = expiryYear;
    this.cardBrand = cardBrand;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the payment method is a card
   */
  public isCard(): boolean {
    return this.type === PaymentMethodType.CARD;
  }

  /**
   * Checks if the payment method is a bank account
   */
  public isBankAccount(): boolean {
    return this.type === PaymentMethodType.BANK_ACCOUNT;
  }

  /**
   * Checks if the payment method is a digital wallet
   */
  public isDigitalWallet(): boolean {
    return this.type === PaymentMethodType.DIGITAL_WALLET;
  }

  /**
   * Checks if the payment method has expired
   * Returns false for non-card payment methods or cards without expiry info
   */
  public isExpired(): boolean {
    if (
      this.type !== PaymentMethodType.CARD ||
      !this.expiryMonth ||
      !this.expiryYear
    ) {
      return false;
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
    const currentYear = now.getFullYear();
    const expiryMonth = parseInt(this.expiryMonth, 10);
    const expiryYear = parseInt(this.expiryYear, 10);

    return (
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    );
  }

  /**
   * Gets a masked representation of the payment method
   */
  public getMaskedRepresentation(): string {
    if (this.type === PaymentMethodType.CARD && this.lastFour) {
      const brand = this.cardBrand ? `${this.cardBrand} ` : "";
      return `${brand}•••• ${this.lastFour}`;
    }

    if (this.type === PaymentMethodType.BANK_ACCOUNT && this.lastFour) {
      return `Bank account ending in ${this.lastFour}`;
    }

    if (this.type === PaymentMethodType.DIGITAL_WALLET) {
      return this.provider.charAt(0).toUpperCase() + this.provider.slice(1);
    }

    return "Unknown payment method";
  }
}
