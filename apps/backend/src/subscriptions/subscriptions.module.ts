import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [ConfigModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
