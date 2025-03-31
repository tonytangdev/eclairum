"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/api";
import axios, { AxiosError } from "axios";
import { Subscription } from "@eclairum/core/entities";

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

/**
 * Server action to fetch the current user's subscription.
 * Requires the user to be authenticated.
 * @returns {Promise<Subscription | null>} The user's subscription details or null.
 */
export async function getUserSubscription(): Promise<Subscription | null> {
  try {
    const session = await auth();
    const userId = session?.userId; // Standard access pattern

    if (!userId) {
      console.log("getUserSubscription: User not authenticated.");
      return null; // Not logged in
    }

    console.log(
      `getUserSubscription: Fetching subscription for user ${userId}`,
    );

    // Make API call to backend
    const response = await serverApi.get<Subscription | null>(
      `/subscriptions/user/${userId}`,
    );

    console.log(
      `getUserSubscription: API response status ${response.status} for user ${userId}`,
    );

    // Axios returns data in response.data
    return response.data;
  } catch (error: unknown) {
    // Check if it's an Axios error
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Handle potential 404 (User/Subscription not found) gracefully by returning null
      if (axiosError.response?.status === 404) {
        console.log(
          `getUserSubscription: Subscription or user not found (404) for user.`,
        );
        return null;
      }
      // Log other Axios errors
      console.error(
        "getUserSubscription: Axios error fetching subscription:",
        axiosError.response?.data || axiosError.message,
      );
    } else {
      // Log non-Axios errors
      console.error(
        "getUserSubscription: Non-Axios error fetching subscription:",
        error,
      );
    }
    return null; // Return null on errors for robustness in UI
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
