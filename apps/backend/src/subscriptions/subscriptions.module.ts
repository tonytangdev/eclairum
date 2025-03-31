import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from './stripe.service';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [ConfigModule, RepositoriesModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService],
  exports: [SubscriptionsService, StripeService], // Export service if needed by other modules
})
export class SubscriptionsModule {}
