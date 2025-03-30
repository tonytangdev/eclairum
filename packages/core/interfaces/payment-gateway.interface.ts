/**
 * Represents the input for creating a customer in the payment gateway.
 */
export interface CreateCustomerInput {
  email: string;
  name?: string; // Optional name
  userId: string; // Our internal user ID for mapping
}

/**
 * Represents the output after creating a customer.
 */
export interface CreateCustomerOutput {
  customerId: string; // The ID from the payment gateway
}

/**
 * Represents the input for creating a subscription in the payment gateway.
 */
export interface CreateSubscriptionInput {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string | number | null>;
}

/**
 * Represents the output after creating a subscription.
 */
export interface CreateSubscriptionOutput {
  subscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  priceId: string;
  cancelAtPeriodEnd: boolean;
  customerId: string;
}

/**
 * Represents the output after fetching an existing subscription.
 * Often similar/identical to CreateSubscriptionOutput.
 */
export type GetSubscriptionOutput = CreateSubscriptionOutput;

export interface PaymentGateway {
  findOrCreateCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerOutput>;
  createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionOutput>;

  /**
   * Fetches details of an existing subscription from the payment gateway.
   * @param stripeSubscriptionId - The ID of the subscription in the gateway.
   * @returns The details of the existing subscription.
   */
  getSubscription(stripeSubscriptionId: string): Promise<GetSubscriptionOutput>;

  // Add other relevant methods, e.g., handleWebhookEvent, cancelSubscription
}
