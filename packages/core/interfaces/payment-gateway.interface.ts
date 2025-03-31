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
 * Represents the output after fetching an existing subscription.
 * Often similar/identical to CreateSubscriptionOutput.
 */
export type GetSubscriptionOutput = {
  subscriptionId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  priceId: string;
  cancelAtPeriodEnd: boolean;
  customerId: string;
};

export interface PaymentGateway {
  findOrCreateCustomer(
    input: CreateCustomerInput,
  ): Promise<CreateCustomerOutput>;

  /**
   * Fetches details of an existing subscription from the payment gateway.
   * @param stripeSubscriptionId - The ID of the subscription in the gateway.
   * @returns The details of the existing subscription.
   */
  getSubscription(stripeSubscriptionId: string): Promise<GetSubscriptionOutput>;

  // Add other relevant methods, e.g., handleWebhookEvent, cancelSubscription
}
