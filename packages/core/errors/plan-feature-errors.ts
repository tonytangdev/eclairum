/**
 * Custom error for invalid limit type
 */
export class InvalidLimitTypeError extends Error {
  constructor(limitType: string) {
    super(`Invalid limit type: ${limitType}`);
    this.name = "InvalidLimitTypeError";
  }
}

/**
 * Custom error for invalid numeric limit value
 */
export class InvalidNumericLimitValueError extends Error {
  constructor() {
    super("Numeric limit value must be a positive integer");
    this.name = "InvalidNumericLimitValueError";
  }
}

/**
 * Custom error for invalid boolean limit value
 */
export class InvalidBooleanLimitValueError extends Error {
  constructor() {
    super("Boolean limit value must be 'true' or 'false'");
    this.name = "InvalidBooleanLimitValueError";
  }
}

/**
 * Custom error for invalid storage limit value
 */
export class InvalidStorageLimitValueError extends Error {
  constructor() {
    super("Storage limit value must be a positive integer (in bytes)");
    this.name = "InvalidStorageLimitValueError";
  }
}

/**
 * Custom error for accessing limit value with incorrect type
 */
export class InvalidLimitTypeAccessError extends Error {
  constructor(requestedType: string, actualType: string) {
    super(`Cannot get ${requestedType} limit for ${actualType} limit type`);
    this.name = "InvalidLimitTypeAccessError";
  }
}
