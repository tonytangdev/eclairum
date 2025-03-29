export class InvalidFeatureLimitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidFeatureLimitationError";
    Object.setPrototypeOf(this, InvalidFeatureLimitationError.prototype);
  }
}
