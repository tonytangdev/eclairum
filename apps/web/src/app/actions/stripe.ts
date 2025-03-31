"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/api";
import axios from "axios";

const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

async function getOrCreateStripeCustomer(
  userId: string,
): Promise<string | null> {
  try {
    // First try to get existing customer
    const { data } = await serverApi.get(`/users/${userId}/stripe-customer`);
    return data.stripeCustomerId;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // If no customer exists, create one
      try {
        const { data } = await serverApi.post(
          `/users/${userId}/stripe-customer`,
        );
        return data.stripeCustomerId;
      } catch (createError) {
        console.error("Error creating Stripe customer:", createError);
        throw createError;
      }
    }
    console.error("Error fetching Stripe customer ID:", error);
    throw error;
  }
}

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
    // Get or create the user's Stripe customer ID
    const stripeCustomerId = await getOrCreateStripeCustomer(userId);

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
      subscription_data: {
        metadata: {
          userId,
        },
      },
      ...(stripeCustomerId && { customer: stripeCustomerId }),
      success_url: `${appUrl}`,
      cancel_url: `${appUrl}`,
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
