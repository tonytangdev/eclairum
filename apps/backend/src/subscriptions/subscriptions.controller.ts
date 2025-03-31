import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SyncSubscriptionDto } from './dto/sync-subscription.dto';
import { Subscription } from '@eclairum/core/entities';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sync(
    @Body() syncSubscriptionDto: SyncSubscriptionDto,
  ): Promise<Subscription> {
    const result = await this.subscriptionsService.sync(syncSubscriptionDto);
    return result;
  }

  @Get('user/:userId')
  async fetchForUser(
    @Param('userId') userId: string,
  ): Promise<Subscription | null> {
    const subscription = await this.subscriptionsService.fetchForUser(userId);
    return subscription;
  }
}
