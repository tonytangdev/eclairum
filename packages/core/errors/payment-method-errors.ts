/**
 * Base error class for payment method related errors
 */
export class PaymentMethodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentMethodError";
    Object.setPrototypeOf(this, PaymentMethodError.prototype);
  }
}

/**
 * Error thrown when providing invalid card details
 */
export class InvalidCardDetailsError extends PaymentMethodError {
  constructor(detail: string) {
    super(`Invalid card details: ${detail}`);
    this.name = "InvalidCardDetailsError";
    Object.setPrototypeOf(this, InvalidCardDetailsError.prototype);
  }
}

/**
 * Error thrown when attempting to operate on a payment method with an invalid provider
 */
export class InvalidProviderError extends PaymentMethodError {
  constructor(provider: string) {
    super(`Invalid payment provider: ${provider}`);
    this.name = "InvalidProviderError";
    Object.setPrototypeOf(this, InvalidProviderError.prototype);
  }
}

/**
 * Error thrown when a provider-specific ID is invalid
 */
export class InvalidProviderIdError extends PaymentMethodError {
  constructor() {
    super("Provider payment method ID cannot be empty");
    this.name = "InvalidProviderIdError";
    Object.setPrototypeOf(this, InvalidProviderIdError.prototype);
  }
}
