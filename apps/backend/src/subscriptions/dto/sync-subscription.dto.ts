import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SyncSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  stripeSubscriptionId: string;

  @IsString()
  @IsOptional()
  stripeCustomerId?: string;
}
