import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="text-center space-y-4">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Create Flash Cards in Seconds</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Simply paste text, upload an image, or add a file. It&apos;s that easy!
      </p>
      <div className="flex justify-center gap-4 pt-4">
        <Button size="lg" asChild>
          <a href="#create-now">
            Try It Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/my-flash-cards">View My Cards</Link>
        </Button>
      </div>
    </section>
  );
}
