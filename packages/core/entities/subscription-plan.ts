import { Feature } from "./feature";

interface SubscriptionPlanConstructor {
  id?: string;
  name: string;
  price: number;
  features: Feature[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  isActive?: boolean;
}

export class SubscriptionPlan {
  private readonly id: string;
  private name: string;
  private price: number;
  private features: Feature[];
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;
  private isActive: boolean;

  constructor({
    id = crypto.randomUUID(),
    name,
    price,
    features,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
    isActive = true,
  }: SubscriptionPlanConstructor) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.features = features;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.isActive = isActive;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getPrice(): number {
    return this.price;
  }

  public getFeatures(): Feature[] {
    return this.features;
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

  public getIsActive(): boolean {
    return this.isActive;
  }

  public setName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  public setPrice(price: number): void {
    this.price = price;
    this.updatedAt = new Date();
  }

  public setFeatures(features: Feature[]): void {
    this.features = features;
    this.updatedAt = new Date();
  }

  public setDeletedAt(deletedAt: Date | null): void {
    this.deletedAt = deletedAt;
    this.updatedAt = new Date();
  }

  public setIsActive(isActive: boolean): void {
    this.isActive = isActive;
    this.updatedAt = new Date();
  }
}
