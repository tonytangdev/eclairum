import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateSubscriptionDto } from '../dtos';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly paymentGateway: StripeService) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<void> {
    this.logger.log(
      `Creating subscription with data: ${JSON.stringify(
        createSubscriptionDto,
      )}`,
    );

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
}
