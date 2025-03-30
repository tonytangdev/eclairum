import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  // Example properties - adjust based on your actual needs
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  priceId!: string; // e.g., Stripe Price ID like 'price_123...'
}
