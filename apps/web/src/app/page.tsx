import { HeroSection } from "@/components/landing-page/hero-section";
import { CreateFlashCards } from "@/components/landing-page/create-flash-cards";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { DemoSection } from "@/components/landing-page/demo-section";
import { PricingSection } from "@/components/landing-page/pricing-section";
import { TestimonialsSection } from "@/components/landing-page/testimonials";
import { CTASection } from "@/components/landing-page/cta-section";

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      <HeroSection />
      <CreateFlashCards />
      <HowItWorks />
      <DemoSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}

