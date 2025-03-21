import Image from "next/image";

export function DemoSection() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">See It In Action</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Watch how easy it is to create flash cards</p>
      </div>

      <div className="aspect-video max-w-3xl mx-auto bg-muted rounded-xl overflow-hidden border">
        <div className="w-full h-full flex items-center justify-center">
          <Image
            src="/placeholder.svg?height=540&width=960"
            alt="FlashMe Demo"
            width={960}
            height={540}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
