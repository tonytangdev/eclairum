import { SubscriptionPlan } from "./subscription-plan";
import { User } from "./user";

interface UserSubscriptionConstructor {
  id?: string;
  userId: User["id"];
  subscriptionPlan: SubscriptionPlan;
  startDate: Date;
  endDate?: Date | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class UserSubscription {
  private readonly id: string;
  private readonly userId: User["id"];
  private subscriptionPlan: SubscriptionPlan;
  private startDate: Date;
  private endDate: Date | null;
  private isActive: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor({
    id = crypto.randomUUID(),
    userId,
    subscriptionPlan,
    startDate,
    endDate = null,
    isActive = true,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
  }: UserSubscriptionConstructor) {
    this.id = id;
    this.userId = userId;
    this.subscriptionPlan = subscriptionPlan;
    this.startDate = startDate;
    this.endDate = endDate;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  public getId(): string {
    return this.id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getSubscriptionPlan(): SubscriptionPlan {
    return this.subscriptionPlan;
  }

  public getStartDate(): Date {
    return this.startDate;
  }

  public getEndDate(): Date | null {
    return this.endDate;
  }

  public getIsActive(): boolean {
    return this.isActive;
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

  public setSubscriptionPlan(subscriptionPlan: SubscriptionPlan): void {
    this.subscriptionPlan = subscriptionPlan;
    this.updatedAt = new Date();
  }

  public setStartDate(startDate: Date): void {
    this.startDate = startDate;
    this.updatedAt = new Date();
  }

  public setEndDate(endDate: Date | null): void {
    this.endDate = endDate;
    this.updatedAt = new Date();
  }

  public setIsActive(isActive: boolean): void {
    this.isActive = isActive;
    this.updatedAt = new Date();
  }

  public setDeletedAt(deletedAt: Date | null): void {
    this.deletedAt = deletedAt;
    this.updatedAt = new Date();
  }
}
