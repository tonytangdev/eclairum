/**
 * Base error class for feature usage related errors
 */
export class FeatureUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureUsageError";
    Object.setPrototypeOf(this, FeatureUsageError.prototype);
  }
}

/**
 * Error thrown when attempting to use a negative usage count
 */
export class NegativeUsageCountError extends FeatureUsageError {
  constructor() {
    super("Usage count cannot be negative");
    this.name = "NegativeUsageCountError";
    Object.setPrototypeOf(this, NegativeUsageCountError.prototype);
  }
}

/**
 * Error thrown when attempting to increment or decrement by a non-positive amount
 */
export class InvalidUsageAmountError extends FeatureUsageError {
  constructor(operation: string) {
    super(`${operation} amount must be positive`);
    this.name = "InvalidUsageAmountError";
    Object.setPrototypeOf(this, InvalidUsageAmountError.prototype);
  }
}

/**
 * Error thrown when providing an invalid reset date
 */
export class InvalidResetDateError extends FeatureUsageError {
  constructor() {
    super("Reset date cannot be null or undefined");
    this.name = "InvalidResetDateError";
    Object.setPrototypeOf(this, InvalidResetDateError.prototype);
  }
}

/**
 * Error thrown when providing a negative limit
 */
export class NegativeLimitError extends FeatureUsageError {
  constructor() {
    super("Limit cannot be negative");
    this.name = "NegativeLimitError";
    Object.setPrototypeOf(this, NegativeLimitError.prototype);
  }
}
