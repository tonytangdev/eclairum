import { AppTitle } from "@/components/ui/app-title";

export function HeroSection() {
  return (
    <section className="text-center space-y-6 py-12">
      {/* Main app title with larger size */}
      <div className="space-y-3">
        <AppTitle
          className="justify-center"
          iconSize={10}
          textSize="text-5xl md:text-6xl"
        />
        {/* Tagline with different style */}
        <p className="text-2xl md:text-3xl text-muted-foreground font-medium italic">
          Create Flash Cards in Seconds
        </p>
      </div>

      {/* Description */}
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        Simply paste text, upload an image, or add a file. It&apos;s that easy!
      </p>
    </section>
  );
}
