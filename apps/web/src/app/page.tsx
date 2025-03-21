import { HeroSection } from "./_components/hero-section";
import { CreateFlashCards } from "./_components/create-flash-cards";
import { HowItWorks } from "./_components/how-it-works";
import { DemoSection } from "./_components/demo-section";
import { PricingSection } from "./_components/pricing-section";
import { TestimonialsSection } from "./_components/testimonials";
import { CTASection } from "./_components/cta-section";

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

