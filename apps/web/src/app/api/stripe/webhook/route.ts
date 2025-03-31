import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { serverApi } from "@/lib/api";
import { SyncSubscriptionDto } from "@eclairum/backend/dtos";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const relevantEvent: Stripe.WebhookEndpointCreateParams.EnabledEvent =
  "checkout.session.completed";

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
      `Webhook Warning: ${relevantEvent} received for session ${sessionId}, but payment_status is ${session.payment_status}. Skipping backend call.`,
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
    `Webhook Processed: ${relevantEvent} for session: ${sessionId}, User ID: ${validatedData.userId}, Price ID: ${validatedData.priceId}`,
  );

  console.log(JSON.stringify(validatedData));

  // Construct the DTO matching the backend's SyncSubscriptionDto
  const syncSubscriptionDto: SyncSubscriptionDto = {
    userId: validatedData.userId,
    stripeSubscriptionId: validatedData.stripeSubscriptionId,
    stripeCustomerId: validatedData.stripeCustomerId,
  };

  try {
    // Assuming the backend endpoint for syncing is still POST /subscriptions
    // If the endpoint changed (e.g., to PUT /subscriptions/sync), update this URL.
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
    // Throw to indicate the webhook processing failed at the backend step
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
      case relevantEvent: {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      // TODO: Add cases for other relevant events (e.g., subscription updates/deletions)
      // case 'customer.subscription.updated':
      //   // handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      //   break;
      // case 'customer.subscription.deleted':
      //   // handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
      //   break;
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
      { status: 200 }, // Or 500 if you prefer Stripe retries for these issues
    );
  }

  // Acknowledge successful receipt and handling (or graceful skip)
  return NextResponse.json({ received: true, acknowledged: true });
}
