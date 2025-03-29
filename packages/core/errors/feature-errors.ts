/**
 * Error thrown when an invalid maximum usage limit is specified for a feature.
 * This happens when attempting to set a non-positive number as the maxUsage.
 */
export class InvalidFeatureUsageLimitError extends Error {
  constructor(
    message = "Maximum usage limit must be greater than 0 or null for unlimited usage",
  ) {
    super(message);
    this.name = "InvalidFeatureUsageLimitError";
    Object.setPrototypeOf(this, InvalidFeatureUsageLimitError.prototype);
  }
}
