"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";

const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export async function createCheckoutSession() {
  if (!premiumPriceId) {
    throw new Error("STRIPE_PREMIUM_PRICE_ID environment variable is not set.");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set.");
  }

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User must be authenticated to create a checkout session");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: premiumPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
    });

    if (!session.url) {
      throw new Error("Could not create Stripe Checkout Session.");
    }

    redirect(session.url);
  } catch (error) {
    console.error("Error creating Stripe Checkout Session:", error);
    throw error;
  }
}
