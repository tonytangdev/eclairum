import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="bg-primary/10 p-8 rounded-xl text-center space-y-4">
      <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Create your first flash card in seconds. No credit card required.
      </p>
      <Button size="lg" className="mt-2">
        Get Started Now
      </Button>
    </section>
  );
}
