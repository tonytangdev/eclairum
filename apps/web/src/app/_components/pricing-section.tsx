import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createCheckoutSession, getUserSubscription } from "@/app/actions/stripe";
import { Check } from "lucide-react";
import { SubscriptionStatus } from "@eclairum/core/entities";

export async function PricingSection() {
  const subscription = await getUserSubscription();

  const isActivePremium =
    subscription?.status === SubscriptionStatus.ACTIVE ||
    subscription?.status === SubscriptionStatus.TRIALING;
  const currentPlan = isActivePremium ? "Premium" : "Free";

  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Simple Pricing</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Start for free, upgrade when you need more</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>For casual users</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-3xl font-bold">$0</p>
            <p className="text-muted-foreground">Forever free</p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Up to 5 uploads</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Basic flash card creation</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Text and image support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              disabled={currentPlan === "Free"}
            >
              {currentPlan === "Free"
                ? "Current Plan"
                : "Your Plan (Free)"
              }
            </Button>
          </CardFooter>
        </Card>

        <Card className={`flex flex-col ${currentPlan === 'Premium' ? 'border-primary' : ''}`}>
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <CardDescription>For serious learners</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-3xl font-bold">$9.99</p>
            <p className="text-muted-foreground">per month</p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Unlimited uploads</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Advanced flash card features</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>AI-powered learning suggestions</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <form action={createCheckoutSession} className="w-full">
              <Button
                className="w-full"
                type="submit"
                disabled={currentPlan === "Premium"}
              >
                {currentPlan === "Premium" ? "Current Plan" : "Upgrade Now"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
