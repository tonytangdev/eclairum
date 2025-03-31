import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sync(@Body() syncSubscriptionDto: SyncSubscriptionDto): Promise<void> {
    await this.subscriptionsService.sync(syncSubscriptionDto);
  }
}
