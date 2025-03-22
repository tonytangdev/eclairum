import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import QuizDetailsClient from "./_components/QuizDetailsClient"
import { fetchQuizGenerationTask } from "./_actions/fetch-quiz-generation-task";

export default async function QuizDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await fetchQuizGenerationTask(id)

  if (!response.success || !response.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Quiz not found</h2>
        <p className="text-muted-foreground">
          {response.error || "The quiz you're looking for does not exist or has been deleted."}
        </p>
        <Button asChild>
          <Link href="/my-flash-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Flash Cards
          </Link>
        </Button>
      </div>
    )
  }

  return <QuizDetailsClient initialQuiz={response.data} />
}

