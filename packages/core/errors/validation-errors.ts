export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RequiredContentError extends ValidationError {
  constructor(entityName: string = "Entity") {
    super(`Content is required for ${entityName}`);
    this.name = "RequiredContentError";
    Object.setPrototypeOf(this, RequiredContentError.prototype);
  }
}

export class EmptyAnswersError extends ValidationError {
  constructor() {
    super("At least one answer is required");
    this.name = "EmptyAnswersError";
    Object.setPrototypeOf(this, EmptyAnswersError.prototype);
  }
}

export class RequiredTextContentError extends ValidationError {
  constructor() {
    super("Text content is required");
    this.name = "RequiredTextContentError";
    Object.setPrototypeOf(this, RequiredTextContentError.prototype);
  }
}
