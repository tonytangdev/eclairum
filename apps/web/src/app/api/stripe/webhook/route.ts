import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { serverApi } from "@/lib/api";
import { CreateSubscriptionDto } from "@eclairum/backend/dtos";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET environment variable is not set.");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 },
    );
  }

  const body = await req.text();

  // Await headers() before calling .get()
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header.");
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook error: ${errorMessage}` },
      { status: 400 },
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const sessionFromEvent = event.data.object as Stripe.Checkout.Session;
    const sessionId = sessionFromEvent.id;

    try {
      // Retrieve the session with expanded line_items
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      });

      console.log(JSON.stringify(session, null, 2));

      // Check if the payment status is 'paid'
      if (session.payment_status === "paid") {
        const userId = session.metadata?.userId;
        // customer and subscription IDs should be available directly
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        // Extract priceId from the expanded line items
        let priceId: string | undefined;
        if (session.line_items?.data?.length) {
          // Assuming the first line item contains the relevant price
          priceId = session.line_items.data[0].price?.id;
        }

        // Validate required data
        if (!userId) {
          console.error(
            `Webhook Error: Missing userId in metadata for session ${sessionId}`,
          );
          // Still return 200 to Stripe, but log the error.
          // Consider more robust error handling or alerting based on requirements.
          return NextResponse.json({
            received: true,
            acknowledged: false,
            error: "Missing userId",
          });
        }
        if (typeof stripeCustomerId !== "string") {
          console.error(
            `Webhook Error: Invalid or missing stripeCustomerId for session ${sessionId}`,
          );
          return NextResponse.json({
            received: true,
            acknowledged: false,
            error: "Missing or invalid stripeCustomerId",
          });
        }
        if (typeof stripeSubscriptionId !== "string") {
          console.error(
            `Webhook Error: Invalid or missing stripeSubscriptionId for session ${sessionId}`,
          );
          return NextResponse.json({
            received: true,
            acknowledged: false,
            error: "Missing or invalid stripeSubscriptionId",
          });
        }
        if (typeof priceId !== "string") {
          console.error(
            `Webhook Error: Invalid or missing priceId in line_items for session ${sessionId}`,
          );
          return NextResponse.json({
            received: true,
            acknowledged: false,
            error: "Missing or invalid priceId",
          });
        }

        console.log(
          `🎣 Webhook received & session retrieved: checkout.session.completed for session: ${sessionId}, User ID: ${userId}, Customer ID: ${stripeCustomerId}, Subscription ID: ${stripeSubscriptionId}, Price ID: ${priceId}`,
        );

        // Prepare data for backend
        // WARNING: Ensure CreateSubscriptionDto at '@eclairum/backend/dtos'
        // matches the fields being assigned below (userId, priceId, etc.)
        const createSubscriptionDto: CreateSubscriptionDto = {
          userId,
          priceId,
        };

        // Call the backend service
        try {
          await serverApi.post("/subscriptions", createSubscriptionDto);
          console.log(
            `Successfully called backend /subscriptions for user ${userId}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `Webhook Error: Failed to call backend /subscriptions for user ${userId}, session ${sessionId}: ${errorMessage}`,
            error, // Log the full error object for more details
          );
          // Still return 200 to Stripe, but log the critical failure.
          // Implement retry logic or alerting if necessary.
          return NextResponse.json({
            received: true,
            acknowledged: false,
            error: "Backend API call failed",
          });
        }
      } else {
        console.warn(
          `Webhook Warning: checkout.session.completed received for session ${session.id}, but payment_status is ${session.payment_status}`,
        );
      }
    } catch (retrieveError) {
      const errorMessage =
        retrieveError instanceof Error
          ? retrieveError.message
          : "Unknown error";
      console.error(
        `Webhook Error: Failed to retrieve session ${sessionId}: ${errorMessage}`,
      );
      // Decide how to handle this - return error or just log?
      // Returning 500 as we couldn't process the event fully.
      return NextResponse.json(
        { error: "Failed to retrieve session details" },
        { status: 500 },
      );
    }
  }
  // TODO: Handle other event types if needed, e.g., 'invoice.paid' for renewals,
  // 'customer.subscription.deleted' for cancellations, etc.
  else {
    console.log(`Unhandled webhook event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true, acknowledged: true });
}
