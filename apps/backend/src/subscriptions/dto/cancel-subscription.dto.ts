import { IsBoolean } from 'class-validator';

export class CancelSubscriptionDto {
  @IsBoolean()
  cancelAtPeriodEnd: boolean;
}
