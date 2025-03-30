import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

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
    const session = event.data.object as Stripe.Checkout.Session;

    // Check if the payment status is 'paid' (although usually it is for this event)
    if (session.payment_status === "paid") {
      const userId = session.metadata?.userId;
      const sessionId = session.id;

      if (!userId) {
        console.error(
          `Webhook Error: Missing userId in metadata for session ${sessionId}`,
        );
        // Still return 200 to Stripe, but log the error
        return NextResponse.json({ received: true });
      }

      console.log(
        `🎣 Webhook received: checkout.session.completed for session: ${sessionId}, User ID: ${userId}`,
      );
      // TODO: Here you would update the user's subscription status in your database
      // using the userId from the metadata.
    } else {
      console.warn(
        `Webhook Warning: checkout.session.completed received for session ${session.id}, but payment_status is ${session.payment_status}`,
      );
    }
  }
  // TODO: Handle other event types if needed, e.g., 'invoice.paid' for renewals,
  // 'customer.subscription.deleted' for cancellations, etc.
  else {
    console.log(`Unhandled webhook event type: ${event.type}`);
  }

  console.log("test");

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
