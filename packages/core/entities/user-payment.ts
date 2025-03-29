import { SubscriptionPlan } from "./subscription-plan";

interface UserPaymentConstructor {
  id?: string;
  userId: string;
  subscriptionPlan: SubscriptionPlan;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  isSuccessful?: boolean;
}

export class UserPayment {
  private readonly id: string;
  private readonly userId: string;
  private readonly subscriptionPlan: SubscriptionPlan;
  private readonly amount: number;
  private readonly paymentDate: Date;
  private readonly paymentMethod: string;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;
  private isSuccessful: boolean;

  constructor({
    id = crypto.randomUUID(),
    userId,
    subscriptionPlan,
    amount,
    paymentDate,
    paymentMethod,
    createdAt = new Date(),
    updatedAt = new Date(),
    deletedAt = null,
    isSuccessful = true,
  }: UserPaymentConstructor) {
    this.id = id;
    this.userId = userId;
    this.subscriptionPlan = subscriptionPlan;
    this.amount = amount;
    this.paymentDate = paymentDate;
    this.paymentMethod = paymentMethod;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.isSuccessful = isSuccessful;
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

  public getAmount(): number {
    return this.amount;
  }

  public getPaymentDate(): Date {
    return this.paymentDate;
  }

  public getPaymentMethod(): string {
    return this.paymentMethod;
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

  public setDeletedAt(deletedAt: Date | null): void {
    this.deletedAt = deletedAt;
    this.updatedAt = new Date();
  }

  public getIsSuccessful(): boolean {
    return this.isSuccessful;
  }

  public setIsSuccessful(isSuccessful: boolean): void {
    this.isSuccessful = isSuccessful;
    this.updatedAt = new Date();
  }
}
