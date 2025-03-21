import { Card, CardContent, CardFooter } from "@/components/ui/card";

const testimonialData = [
  {
    name: "Sarah Johnson",
    role: "Medical Student",
    quote:
      "FlashMe helped me memorize complex medical terms in half the time. The interface is so intuitive!",
  },
  {
    name: "David Chen",
    role: "Language Learner",
    quote:
      "I use FlashMe every day to practice vocabulary. Being able to add images makes learning so much easier.",
  },
  {
    name: "Maria Garcia",
    role: "History Teacher",
    quote: "My students love using FlashMe for exam prep. The simplicity makes it accessible for everyone.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">What Our Users Say</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Join thousands of satisfied learners</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonialData.map((testimonial, i) => (
          <Card key={i} className="flex flex-col">
            <CardContent className="flex-1 pt-6">
              <p className="italic">&quot;{testimonial.quote}&quot;</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="font-semibold">{testimonial.name}</p>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
