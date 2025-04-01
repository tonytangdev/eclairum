import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  cancelAtPeriodEnd: boolean;
}
