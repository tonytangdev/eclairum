import { InvalidFeatureUsageLimitError } from "../errors/feature-errors";

interface FeatureConstructor {
  id?: string;
  name: string;
  maxUsage?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  isEnabled?: boolean;
}

export class Feature {
  id: string;
  name: string;
  maxUsage: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  isEnabled: boolean;

  constructor({
    id = crypto.randomUUID(),
    name,
    maxUsage = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
    isEnabled = true,
  }: FeatureConstructor) {
    this.id = id;
    this.name = name;

    if (maxUsage !== null && maxUsage <= 0) {
      throw new InvalidFeatureUsageLimitError();
    }
    this.maxUsage = maxUsage;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.isEnabled = isEnabled;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getMaxUsage(): number | null {
    return this.maxUsage;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setIsEnabled(value: boolean): void {
    this.isEnabled = value;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public setMaxUsage(maxUsage: number | null): void {
    if (maxUsage !== null && maxUsage <= 0) {
      throw new InvalidFeatureUsageLimitError();
    }
    this.maxUsage = maxUsage;
  }

  public setUpdatedAt(updatedAt: Date): void {
    this.updatedAt = updatedAt;
  }

  public setDeletedAt(deletedAt: Date | null): void {
    this.deletedAt = deletedAt;
  }

  public isUnlimited(): boolean {
    return this.maxUsage === null;
  }
}
