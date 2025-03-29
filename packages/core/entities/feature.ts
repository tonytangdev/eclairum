import { RequiredFieldError } from "../errors/validation-errors";

/**
 * Constructor parameters for creating a Feature
 */
type FeatureConstructor = {
  id?: string;
  name: string;
  key: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Represents a feature in the system that can be associated with subscription plans
 */
export class Feature {
  private id: string;
  private name: string;
  private key: string;
  private description: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  /**
   * Creates a new Feature
   * @param params Feature parameters
   * @throws RequiredFieldError if required fields are missing or invalid
   */
  constructor({
    id = crypto.randomUUID(),
    name,
    key,
    description = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }: FeatureConstructor) {
    if (!name || name.trim() === "") {
      throw new RequiredFieldError("name", "Feature");
    }

    if (!key || key.trim() === "") {
      throw new RequiredFieldError("key", "Feature");
    }

    // Validate key format (alphanumeric with underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      throw new Error(
        "Feature key must contain only letters, numbers, and underscores",
      );
    }

    this.id = id;
    this.name = name;
    this.key = key.toLowerCase(); // Normalize key to lowercase
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Gets the feature's unique identifier
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gets the feature's name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Gets the feature's unique key used for programmatic access
   */
  public getKey(): string {
    return this.key;
  }

  /**
   * Gets the feature's description
   */
  public getDescription(): string | null {
    return this.description;
  }

  /**
   * Gets the feature's creation date
   */
  public getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the feature's last update date
   */
  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Sets the feature's name and updates the timestamp
   */
  public setName(name: string): void {
    if (!name || name.trim() === "") {
      throw new RequiredFieldError("name", "Feature");
    }

    this.name = name;
    this.updatedAt = new Date();
  }

  /**
   * Sets the feature's key and updates the timestamp
   */
  public setKey(key: string): void {
    if (!key || key.trim() === "") {
      throw new RequiredFieldError("key", "Feature");
    }

    // Validate key format
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      throw new Error(
        "Feature key must contain only letters, numbers, and underscores",
      );
    }

    this.key = key.toLowerCase(); // Normalize key to lowercase
    this.updatedAt = new Date();
  }

  /**
   * Sets the feature's description and updates the timestamp
   */
  public setDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }
}
