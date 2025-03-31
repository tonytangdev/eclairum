import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreateCustomerInput,
  CreateCustomerOutput,
  GetSubscriptionOutput,
  PaymentGateway,
} from '@eclairum/core/interfaces'; // Reverted import path - ensure core exports these

@Injectable()
export class StripeService implements PaymentGateway {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.error('STRIPE_SECRET_KEY is not configured.');
      throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-02-24.acacia', // Updated API version as per linter
      typescript: true,
    });
    this.logger.log('StripeService initialized');
  }

  async findOrCreateCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerOutput> {
    this.logger.log(
      `Finding or creating customer for user ID: ${input.userId}`,
    );
    try {
      const existingCustomers = await this.stripe.customers.search({
        query: `metadata['userId']:'${input.userId}'`,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        this.logger.log(
          `Found existing customer: ${existingCustomers.data[0].id}`,
        );
        return { customerId: existingCustomers.data[0].id };
      }

      this.logger.log(
        `Customer not found, creating new one for ${input.email}`,
      );
      const customer = await this.stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: {
          userId: input.userId,
        },
      });
      this.logger.log(`Customer created: ${customer.id}`);
      return { customerId: customer.id };
    } catch (error: unknown) {
      // Log context first
      this.logger.error('Context for findOrCreateCustomer error:', { input });
      // Then log the error safely
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in findOrCreateCustomer: ${errorMessage}`,
        errorStack,
      );

      if (error instanceof Stripe.errors.StripeError) {
        this.logger.error(
          `Stripe error code: ${error.code}, message: ${error.message}`,
        );
        throw new InternalServerErrorException(
          `Stripe error: ${error.message}`,
        );
      } else if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An unexpected error occurred while finding or creating customer.',
        );
      }
    }
  }

  async getSubscription(
    stripeSubscriptionId: string,
  ): Promise<GetSubscriptionOutput> {
    this.logger.log(`Fetching subscription: ${stripeSubscriptionId}`);
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Note: retrieve might return null or throw if not found, Stripe SDK behaviour can vary.
      // The catch block handles the specific 'resource_missing' error.
      this.logger.log(`Subscription fetched: ${subscription.id}`);

      // Ensure customer is a string before returning
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

      return {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        priceId: subscription.items.data[0].price.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        customerId: customerId,
      };
    } catch (error: unknown) {
      // Log context first
      this.logger.error('Context for getSubscription error:', {
        stripeSubscriptionId,
      });
      // Then log the error safely
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error fetching subscription ${stripeSubscriptionId}: ${errorMessage}`,
        errorStack,
      );

      if (error instanceof Stripe.errors.StripeError) {
        if (error.code === 'resource_missing') {
          this.logger.warn(`Subscription not found: ${stripeSubscriptionId}`);
          throw new NotFoundException(
            `Subscription with ID ${stripeSubscriptionId} not found.`,
          );
        }
        this.logger.error(
          `Stripe error code: ${error.code}, message: ${error.message}`,
        );
        throw new InternalServerErrorException(
          `Stripe error: ${error.message}`,
        );
      } else if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      } else {
        throw new InternalServerErrorException(
          'An unexpected error occurred while fetching subscription.',
        );
      }
    }
  }
}
