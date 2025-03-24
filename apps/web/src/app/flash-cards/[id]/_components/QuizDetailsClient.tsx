"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Question, Quiz } from "../types"
import { StatusBadge } from "@/app/flash-cards/_components/status-badge"

// Import our extracted components
import { MetadataCard } from "./MetadataCard"
import { ActionCard } from "./ActionCard"
import { SourceTab } from "./SourceTab"
import { QuestionsTab } from "./QuestionsTab"
import { ErrorBoundary } from "./ErrorBoundary"

// Import our custom hooks
import { useQuizDeletion } from "../_hooks"
import { useRouter } from "next/navigation"

interface QuizDetailsClientProps {
  initialQuiz: Quiz;
}

export default function QuizDetailsClient({ initialQuiz }: QuizDetailsClientProps) {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz)
  const [hasError, setHasError] = useState(false)
  const router = useRouter()

  // Use our custom hook for deletion logic
  const { isDeleting, handleDeleteQuiz } = useQuizDeletion()

  // Update the quiz questions when they change
  const handleQuestionsChange = useCallback((updatedQuestions: Question[]) => {
    try {
      setQuiz(prevQuiz => ({
        ...prevQuiz,
        questions: updatedQuestions
      }))
    } catch (error) {
      console.error("Failed to update questions:", error)
      toast("Error updating questions", {
        description: "Your changes couldn't be saved. Please try again.",
      })
      setHasError(true)
    }
  }, [])

  // Reset error state
  const resetError = useCallback(() => {
    setHasError(false)
    // Reset to initial quiz if we had an error
    setQuiz(initialQuiz)
  }, [initialQuiz])

  // Handle starting a quiz
  const handleStartQuiz = useCallback(() => {
    try {
      router.push(`/flash-cards-session?quizGenerationTaskId=${quiz.id}`)
    } catch (error) {
      console.error("Error starting quiz:", error)
      toast("Failed to start quiz", {
        description: "An unexpected error occurred. Please try again."
      })
    }
  }, [quiz.id, router])

  // Log errors for debugging
  useEffect(() => {
    if (hasError) {
      console.error("QuizDetailsClient encountered an error. Resetting state.")
    }
  }, [hasError])

  if (!quiz) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <p>Quiz data is missing or invalid. Please try refreshing the page.</p>
      </div>
    )
  }

  return (
    <ErrorBoundary componentName="Quiz Details" onReset={resetError}>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{quiz.title || "Untitled"}</h1>
              <StatusBadge status={quiz.status} />
            </div>
            <p className="text-muted-foreground">{quiz.category ? `Category: ${quiz.category}` : "No category"}</p>
          </div>
          <Button asChild variant="outline" className="self-start sm:self-center mt-2 sm:mt-0">
            <Link href="/flash-cards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        {/* Content grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {/* Main content area */}
          <Card className="sm:col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Flash Card Details</CardTitle>
              <CardDescription>Review the generated quiz questions and answers</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="questions">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
                  <TabsTrigger value="source">Source Text</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-4 pt-4">
                  <ErrorBoundary componentName="Questions Tab">
                    <QuestionsTab
                      quizId={quiz.id}
                      questions={quiz.questions}
                      onQuestionsChange={handleQuestionsChange}
                    />
                  </ErrorBoundary>
                </TabsContent>

                <TabsContent value="source" className="pt-4">
                  <ErrorBoundary componentName="Source Text">
                    <SourceTab textContent={quiz.textContent} />
                  </ErrorBoundary>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <ErrorBoundary componentName="Metadata Section">
              <MetadataCard
                createdAt={quiz.createdAt}
                category={quiz.category}
              />
            </ErrorBoundary>

            <ErrorBoundary componentName="Actions Section">
              <ActionCard
                isDeleting={isDeleting}
                onDelete={() => handleDeleteQuiz(quiz.id)}
                onStartQuiz={handleStartQuiz}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}