"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Question, Quiz } from "../types"
import { StatusBadge } from "@/components/flash-cards/status-badge"

// Import our extracted components
import { MetadataCard } from "./MetadataCard"
import { ActionCard } from "./ActionCard"
import { SourceTab } from "./SourceTab"
import { QuestionsTab } from "./QuestionsTab"

// Import our custom hooks
import { useQuizDeletion } from "../hooks"

interface QuizDetailsClientProps {
  initialQuiz: Quiz;
}

export default function QuizDetailsClient({ initialQuiz }: QuizDetailsClientProps) {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz)

  // Use our custom hook for deletion logic
  const { isDeleting, handleDeleteQuiz } = useQuizDeletion()

  // Update the quiz questions when they change
  const handleQuestionsChange = useCallback((updatedQuestions: Question[]) => {
    setQuiz(prevQuiz => ({
      ...prevQuiz,
      questions: updatedQuestions
    }))
  }, [])

  // Handle starting a quiz
  const handleStartQuiz = useCallback(() => {
    toast("Starting quiz...")
    // Implementation for starting the quiz would go here
  }, [])

  return (
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
                <QuestionsTab
                  quizId={quiz.id}
                  questions={quiz.questions}
                  onQuestionsChange={handleQuestionsChange}
                />
              </TabsContent>

              <TabsContent value="source" className="pt-4">
                <SourceTab textContent={quiz.textContent} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <MetadataCard
            createdAt={quiz.createdAt}
            category={quiz.category}
          />

          <ActionCard
            isDeleting={isDeleting}
            onDelete={() => handleDeleteQuiz(quiz.id)}
            onStartQuiz={handleStartQuiz}
          />
        </div>
      </div>
    </div>
  )
}