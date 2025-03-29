import { Subscription } from "./subscription";
import { RequiredFieldError } from "../errors/validation-errors";

/**
 * Represents payment status
 */
export enum PaymentStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  PENDING = "pending",
  REFUNDED = "refunded",
}

/**
 * Constructor parameters for creating a Payment
 */
type PaymentConstructor = {
  id?: string;
  subscriptionId: Subscription["id"];
  amount: number; // In cents
  currency?: string;
  status: PaymentStatus;
  provider: string;
  providerPaymentId: string;
  invoiceUrl?: string | null;
  paymentMethodType?: string | null;
  cardLastFour?: string | null;
  cardBrand?: string | null;
  refunded?: boolean;
  refundReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Represents a payment for a subscription
 */
export class Payment {
  private id: string;
  private subscriptionId: Subscription["id"];
  private amount: number;
  private currency: string;
  private status: PaymentStatus;
  private provider: string;
  private providerPaymentId: string;
  private invoiceUrl: string | null;
  private paymentMethodType: string | null;
  private cardLastFour: string | null;
  private cardBrand: string | null;
  private refunded: boolean;
  private refundReason: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new Payment
   * @param params Payment parameters
   * @throws RequiredFieldError if required fields are missing or invalid
   */
  constructor({
    id = crypto.randomUUID(),
    subscriptionId,
    amount,
    currency = "EUR",
    status,
    provider,
    providerPaymentId,
    invoiceUrl = null,
    paymentMethodType = null,
    cardLastFour = null,
    cardBrand = null,
    refunded = false,
    refundReason = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: PaymentConstructor) {
    if (subscriptionId.trim() === "") {
      throw new RequiredFieldError("subscriptionId", "Payment");
    }

    if (amount < 0) {
      throw new Error("Payment amount cannot be negative");
    }

    if (!Object.values(PaymentStatus).includes(status)) {
      throw new Error(`Invalid payment status: ${status}`);
    }

    if (provider.trim() === "") {
      throw new RequiredFieldError("provider", "Payment");
    }

    if (providerPaymentId.trim() === "") {
      throw new RequiredFieldError("providerPaymentId", "Payment");
    }

    // Validate card last four if provided
    if (cardLastFour !== null && !/^\d{4}$/.test(cardLastFour)) {
      throw new Error("Card last four must be exactly 4 digits");
    }

    // Validate currency format
    if (currency.trim() === "") {
      throw new RequiredFieldError("currency", "Payment");
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Currency must be a 3-letter code in uppercase");
    }

    this.id = id;
    this.subscriptionId = subscriptionId;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.provider = provider;
    this.providerPaymentId = providerPaymentId;
    this.invoiceUrl = invoiceUrl;
    this.paymentMethodType = paymentMethodType;
    this.cardLastFour = cardLastFour;
    this.cardBrand = cardBrand;
    this.refunded = refunded;
    this.refundReason = refundReason;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Gets the payment's unique identifier
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gets the associated subscription ID
   */
  public getSubscriptionId(): string {
    return this.subscriptionId;
  }

  /**
   * Gets the payment amount in cents
   */
  public getAmount(): number {
    return this.amount;
  }

  /**
   * Gets the payment currency
   */
  public getCurrency(): string {
    return this.currency;
  }

  /**
   * Gets the formatted amount with currency symbol
   */
  public getFormattedAmount(): string {
    return `${(this.amount / 100).toFixed(2)} ${this.currency}`;
  }

  /**
   * Gets the payment status
   */
  public getStatus(): PaymentStatus {
    return this.status;
  }

  /**
   * Gets the payment provider
   */
  public getProvider(): string {
    return this.provider;
  }

  /**
   * Gets the provider-specific payment ID
   */
  public getProviderPaymentId(): string {
    return this.providerPaymentId;
  }

  /**
   * Gets the invoice URL if available
   */
  public getInvoiceUrl(): string | null {
    return this.invoiceUrl;
  }

  /**
   * Gets the payment method type if available
   */
  public getPaymentMethodType(): string | null {
    return this.paymentMethodType;
  }

  /**
   * Gets the last four digits of the card if available
   */
  public getCardLastFour(): string | null {
    return this.cardLastFour;
  }

  /**
   * Gets the card brand if available
   */
  public getCardBrand(): string | null {
    return this.cardBrand;
  }

  /**
   * Checks if the payment has been refunded
   */
  public isRefunded(): boolean {
    return this.refunded;
  }

  /**
   * Gets the refund reason if available
   */
  public getRefundReason(): string | null {
    return this.refundReason;
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
   * Updates the payment status and updates the timestamp
   */
  public updateStatus(status: PaymentStatus): void {
    if (!Object.values(PaymentStatus).includes(status)) {
      throw new Error(`Invalid payment status: ${status}`);
    }

    this.status = status;
    this.updatedAt = new Date();
  }

  /**
   * Marks the payment as refunded
   * @param reason Optional reason for the refund
   */
  public markAsRefunded(reason: string | null = null): void {
    this.refunded = true;
    this.status = PaymentStatus.REFUNDED;
    this.refundReason = reason;
    this.updatedAt = new Date();
  }

  /**
   * Updates the payment method information
   */
  public updatePaymentMethod(
    paymentMethodType: string | null,
    cardLastFour: string | null,
    cardBrand: string | null,
  ): void {
    // Validate card last four if provided
    if (cardLastFour !== null && !/^\d{4}$/.test(cardLastFour)) {
      throw new Error("Card last four must be exactly 4 digits");
    }

    this.paymentMethodType = paymentMethodType;
    this.cardLastFour = cardLastFour;
    this.cardBrand = cardBrand;
    this.updatedAt = new Date();
  }

  /**
   * Sets the invoice URL
   */
  public setInvoiceUrl(invoiceUrl: string | null): void {
    this.invoiceUrl = invoiceUrl;
    this.updatedAt = new Date();
  }

  /**
   * Checks if payment was successful
   */
  public isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCEEDED && !this.refunded;
  }

  /**
   * Checks if payment is pending
   */
  public isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  /**
   * Checks if payment failed
   */
  public hasFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }
}
