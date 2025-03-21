import { FileText, Upload, BookOpen } from "lucide-react";

export function HowItWorks() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">How It Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Creating flash cards has never been easier</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-4 rounded-full">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium">1. Add Content</h3>
          <p className="text-muted-foreground">Paste text, upload an image, or add a file</p>
        </div>

        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-4 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium">2. Click &quot;Flash me!&quot;</h3>
          <p className="text-muted-foreground">Our system automatically creates flash cards</p>
        </div>

        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-4 rounded-full">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium">3. Start Learning</h3>
          <p className="text-muted-foreground">Review your flash cards anytime, anywhere</p>
        </div>
      </div>
    </section>
  );
}
