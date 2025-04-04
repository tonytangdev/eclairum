export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RequiredContentError extends ValidationError {
  constructor(entityName: string) {
    super(`Content is required for ${entityName}`);
    this.name = "RequiredContentError";
    Object.setPrototypeOf(this, RequiredContentError.prototype);
  }
}

export class RequiredTextContentError extends ValidationError {
  constructor() {
    super("Text content is required");
    this.name = "RequiredTextContentError";
    Object.setPrototypeOf(this, RequiredTextContentError.prototype);
  }
}
