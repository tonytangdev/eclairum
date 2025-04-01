import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { serverApi } from "@/lib/api";
import { SyncSubscriptionDto } from "@eclairum/backend/dtos";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const relevantEvents = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

// --- Helper Functions ---

/**
 * Verifies the Stripe webhook signature and constructs the event.
 * @param body Raw request body text
 * @param signature Stripe-Signature header value
 * @returns The verified Stripe event object
 * @throws Error if webhook secret is missing, signature is missing, or verification fails
 */
const verifyStripeEvent = (
  body: string,
  signature: string | null,
): Stripe.Event => {
  if (!webhookSecret) {
    throw new Error("Webhook error: STRIPE_WEBHOOK_SECRET is not set.");
  }
  if (!signature) {
    throw new Error("Webhook error: Missing stripe-signature header.");
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Log the detailed verification error
    console.error(`Webhook signature verification failed: ${message}`, err);
    throw new Error(`Webhook signature verification failed: ${message}`);
  }
};

interface ValidatedSessionData {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  priceId: string;
}

/**
 * Handles the logic for a successfully paid checkout session.
 * Retrieves full session details, validates data, and calls the backend API.
 * @param sessionFromEvent The checkout session object from the webhook event
 * @throws Error if session retrieval fails, required data is missing/invalid, or backend call fails
 */
const handleCheckoutSessionCompleted = async (
  sessionFromEvent: Stripe.Checkout.Session,
): Promise<void> => {
  const sessionId = sessionFromEvent.id;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `Webhook Error: Failed to retrieve session ${sessionId}: ${message}`,
      err,
    );
    // Throwing allows the main handler to catch and return an appropriate status
    throw new Error(`Failed to retrieve session details for ${sessionId}`);
  }

  // Double-check payment status
  if (session.payment_status !== "paid") {
    console.warn(
      `Webhook Warning: ${relevantEvents[0]} received for session ${sessionId}, but payment_status is ${session.payment_status}. Skipping backend call.`,
    );
    return; // Exit gracefully, no action needed
  }

  // Extract and validate necessary data
  const userId = session.metadata?.userId;
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;
  let priceId: string | undefined;
  if (session.line_items?.data?.length) {
    priceId = session.line_items.data[0].price?.id;
  }

  if (!userId) {
    throw new Error(
      `Webhook Validation Error: Missing userId in metadata for session ${sessionId}`,
    );
  }
  if (typeof stripeCustomerId !== "string") {
    throw new Error(
      `Webhook Validation Error: Invalid or missing stripeCustomerId for session ${sessionId}`,
    );
  }
  if (typeof stripeSubscriptionId !== "string") {
    throw new Error(
      `Webhook Validation Error: Invalid or missing stripeSubscriptionId for session ${sessionId}`,
    );
  }
  if (typeof priceId !== "string") {
    throw new Error(
      `Webhook Validation Error: Invalid or missing priceId in line_items for session ${sessionId}`,
    );
  }

  const validatedData: ValidatedSessionData = {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    priceId,
  };

  console.log(
    `Webhook Processed: ${relevantEvents[0]} for session: ${sessionId}, User ID: ${validatedData.userId}, Price ID: ${validatedData.priceId}`,
  );

  // Construct the DTO matching the backend's SyncSubscriptionDto
  const syncSubscriptionDto: SyncSubscriptionDto = {
    userId: validatedData.userId,
    stripeSubscriptionId: validatedData.stripeSubscriptionId,
    stripeCustomerId: validatedData.stripeCustomerId,
  };

  try {
    await serverApi.post("/subscriptions", syncSubscriptionDto);
    console.log(
      `Successfully called backend /subscriptions to sync for user ${validatedData.userId}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `Webhook Error: Failed to call backend /subscriptions for user ${validatedData.userId}, session ${sessionId}: ${message}`,
      err,
    );
    throw new Error("Backend API call failed");
  }
};

/**
 * Handles subscription cancellation events from Stripe.
 * This includes both immediate cancellations and end-of-period cancellations.
 * @param subscription The subscription object from the webhook event
 */
const handleSubscriptionCancellation = async (
  subscription: Stripe.Subscription,
): Promise<void> => {
  const subscriptionId = subscription.id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Get the user ID from the customer metadata
  const customerResponse = await stripe.customers.retrieve(customerId, {
    expand: ["metadata"],
  });

  // Check if the customer is deleted
  if (customerResponse.deleted) {
    throw new Error(
      `Webhook Validation Error: Customer ${customerId} is deleted for subscription ${subscriptionId}`,
    );
  }

  const userId = customerResponse.metadata?.userId;
  if (!userId) {
    throw new Error(
      `Webhook Validation Error: Missing userId in customer metadata for subscription ${subscriptionId}`,
    );
  }

  console.log(
    `Webhook Processed: Subscription cancellation for subscription: ${subscriptionId}, User ID: ${userId}`,
  );

  // Call the cancel endpoint with the appropriate parameters
  try {
    await serverApi.delete(`/subscriptions/user/${userId}`, {
      data: {
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
    console.log(
      `Successfully processed subscription cancellation for user ${userId}, subscription ${subscriptionId}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `Webhook Error: Failed to process subscription cancellation for user ${userId}, subscription ${subscriptionId}: ${message}`,
      err,
    );
    throw new Error("Backend API call failed");
  }
};

/**
 * Handles subscription update events from Stripe.
 * This includes status changes and other updates, but not cancellations.
 * @param subscription The subscription object from the webhook event
 */
const handleSubscriptionUpdate = async (
  subscription: Stripe.Subscription,
): Promise<void> => {
  const subscriptionId = subscription.id;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Get the user ID from the customer metadata
  const customerResponse = await stripe.customers.retrieve(customerId, {
    expand: ["metadata"],
  });

  // Check if the customer is deleted
  if (customerResponse.deleted) {
    throw new Error(
      `Webhook Validation Error: Customer ${customerId} is deleted for subscription ${subscriptionId}`,
    );
  }

  const userId = customerResponse.metadata?.userId;
  if (!userId) {
    throw new Error(
      `Webhook Validation Error: Missing userId in customer metadata for subscription ${subscriptionId}`,
    );
  }

  console.log(
    `Webhook Processed: Subscription update for subscription: ${subscriptionId}, User ID: ${userId}`,
  );

  // Use the same sync endpoint to update the subscription
  const syncSubscriptionDto: SyncSubscriptionDto = {
    userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
  };

  try {
    await serverApi.post("/subscriptions", syncSubscriptionDto);
    console.log(
      `Successfully synced subscription update for user ${userId}, subscription ${subscriptionId}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      `Webhook Error: Failed to sync subscription update for user ${userId}, subscription ${subscriptionId}: ${message}`,
      err,
    );
    throw new Error("Backend API call failed");
  }
};

// --- Main POST Handler ---

export async function POST(req: Request) {
  let event: Stripe.Event;
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    event = verifyStripeEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    // Return 400 for signature/secret issues
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case relevantEvents[0]: {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case relevantEvents[1]: {
        const subscription = event.data.object as Stripe.Subscription;
        // Check if this is a cancellation update
        if (
          subscription.cancel_at_period_end ||
          subscription.status === "canceled"
        ) {
          await handleSubscriptionCancellation(subscription);
        } else {
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }
      case relevantEvents[2]: {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error(
      `Webhook Error processing event ${event.id} (type: ${event.type}): ${message}`,
      err,
    );
    // For internal processing errors (retrieval, validation, backend call),
    // return 200 to prevent Stripe retries for potentially unrecoverable errors,
    // while indicating our internal failure via the response body.
    return NextResponse.json(
      { received: true, acknowledged: false, error: message },
      { status: 200 },
    );
  }

  // Acknowledge successful receipt and handling (or graceful skip)
  return NextResponse.json({ received: true, acknowledged: true });
}
