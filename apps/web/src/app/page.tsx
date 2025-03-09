import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ArrowRight, Upload, BookOpen, File, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Create Flash Cards in Seconds</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Simply paste text, upload an image, or add a file. It's that easy!
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

      {/* Create Flash Cards Section - Now First! */}
      <section id="create-now" className="space-y-8">
        <Card className="max-w-3xl mx-auto border-primary shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Create Flash Cards</CardTitle>
            <CardDescription>Upload text, images, or files to create flash cards instantly</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid grid-cols-2 mb-6 w-full">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2 relative group">
                    <Upload className="h-4 w-4" />
                    Upload
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Coming soon!
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <Textarea placeholder="Enter your text here..." className="min-h-[150px]" />
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 transition-colors min-h-[150px] flex flex-col items-center justify-center text-center border-muted-foreground/20 relative">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                      <p className="text-muted-foreground mb-2">File upload feature coming soon!</p>
                      <p className="text-sm text-muted-foreground">
                        This feature is not available in the current version.
                      </p>
                    </div>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4">Drag and drop files here</p>
                    <div className="flex gap-2">
                      <Button variant="outline" disabled>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                      <Button variant="outline" disabled>
                        <File className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <CardFooter className="border-t px-6 py-4 -mx-6 mt-6 rounded-b-lg">
                <Button size="lg" className="w-full py-6 text-lg">
                  <Upload className="mr-2 h-5 w-5" />
                  Flash me!
                </Button>
              </CardFooter>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How It Works Section */}
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
            <h3 className="text-xl font-medium">2. Click "Flash me!"</h3>
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

      {/* Rest of the page content remains the same */}
      {/* Demo Section */}
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

      {/* Pricing Section */}
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
              <Button variant="outline" className="w-full">
                Current Plan
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col border-primary">
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
              <Button className="w-full">Upgrade Now</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">What Our Users Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Join thousands of satisfied learners</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
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
          ].map((testimonial, i) => (
            <Card key={i} className="flex flex-col">
              <CardContent className="flex-1 pt-6">
                <p className="italic">"{testimonial.quote}"</p>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/10 p-8 rounded-xl text-center space-y-4">
        <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create your first flash card in seconds. No credit card required.
        </p>
        <Button size="lg" className="mt-2">
          Get Started Now
        </Button>
      </section>
    </div>
  )
}

