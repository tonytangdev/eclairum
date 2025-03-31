import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  GetSubscriptionOutput,
  PaymentGateway,
  CreateCustomerInput,
  CreateCustomerOutput,
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
    this.logger.log(`Finding or creating customer for user: ${input.userId}`);
    try {
      // First try to find existing customer
      const existingCustomers = await this.stripe.customers.search({
        query: `metadata['userId']:'${input.userId}'`,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customerId = existingCustomers.data[0].id;
        this.logger.log(`Found existing customer: ${customerId}`);
        return { customerId };
      }

      // If no customer found, create a new one
      this.logger.log(`Creating new customer for user: ${input.userId}`);
      const customer = await this.stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: {
          userId: input.userId,
        },
      });

      this.logger.log(`Created new customer: ${customer.id}`);
      return { customerId: customer.id };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error finding/creating customer for user ${input.userId}: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while finding/creating customer.',
      );
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

  async findCustomerByUserId(
    userId: string,
  ): Promise<{ customerId: string } | null> {
    this.logger.log(`Finding customer by internal user ID: ${userId}`);
    try {
      const existingCustomers = await this.stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customerId = existingCustomers.data[0].id;
        this.logger.log(`Found customer: ${customerId}`);
        return { customerId };
      }

      this.logger.log(`Customer not found for user ID: ${userId}`);
      return null;
    } catch (error: unknown) {
      // Log the error safely
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error finding customer by user ID ${userId}: ${errorMessage}`,
        errorStack,
      );
      // Don't throw specific exceptions here, let the caller handle null
      // Re-throwing might obscure the fact that the customer simply wasn't found
      throw new InternalServerErrorException(
        'An unexpected error occurred while finding customer by user ID.',
      );
    }
  }
}
