"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Tag,
  PlayCircle,
  PenLine,
  Share2,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/dates"
import { ClientPagination } from "@/components/pagination"
import { Quiz, Question, QuizGenerationStatus } from "../types"
import QuestionItem from "./QuestionItem"

interface QuizDetailsClientProps {
  initialQuiz: Quiz;
}

export default function QuizDetailsClient({ initialQuiz }: QuizDetailsClientProps) {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz)
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 10
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null)
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("")

  // Status utilities
  const getStatusIcon = (status: QuizGenerationStatus) => {
    switch (status) {
      case QuizGenerationStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4" />
      case QuizGenerationStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 animate-pulse" />
      case QuizGenerationStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case QuizGenerationStatus.FAILED:
        return <AlertCircle className="h-4 w-4" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: QuizGenerationStatus) => {
    switch (status) {
      case QuizGenerationStatus.COMPLETED:
        return "bg-green-500 text-white hover:bg-green-600"
      case QuizGenerationStatus.IN_PROGRESS:
        return "bg-amber-500 text-white hover:bg-amber-600"
      case QuizGenerationStatus.PENDING:
        return "bg-blue-500 text-white hover:bg-blue-600"
      case QuizGenerationStatus.FAILED:
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  // Question editing functions
  const startEditingQuestion = (question: Question) => {
    setEditingQuestionId(question.id)
    setEditedQuestion({ ...question, answers: [...question.answers] })
    setOpenAccordionItem(question.id)
  }

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null)
    setEditedQuestion(null)
  }

  const updateEditedQuestionContent = (content: string) => {
    setEditedQuestion((prev) => prev ? ({ ...prev, content }) : null)
  }

  const updateEditedAnswerContent = (answerId: string, content: string) => {
    setEditedQuestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: prev.answers.map((a) => (a.id === answerId ? { ...a, content } : a)),
      };
    })
  }

  const updateCorrectAnswer = (answerId: string) => {
    setEditedQuestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: prev.answers.map((a) => ({ ...a, isCorrect: a.id === answerId })),
      };
    })
  }

  const saveEditedQuestion = () => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === editingQuestionId ? editedQuestion! : q)),
    }))
    setEditingQuestionId(null)
    setEditedQuestion(null)
  }

  // Pagination logic
  const totalQuestions = quiz.questions.length
  const totalPages = Math.ceil(totalQuestions / questionsPerPage)
  const indexOfLastQuestion = currentPage * questionsPerPage
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
  const currentQuestions = quiz.questions.slice(indexOfFirstQuestion, indexOfLastQuestion)

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{quiz.title || "Untitled Quiz"}</h1>
            <Badge className={getStatusColor(quiz.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(quiz.status)}
                {quiz.status}
              </span>
            </Badge>
          </div>
          <p className="text-muted-foreground">{quiz.category ? `Category: ${quiz.category}` : "No category"}</p>
        </div>
        <Button asChild variant="outline" className="self-start sm:self-center mt-2 sm:mt-0">
          <Link href="/my-flash-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
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
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    This quiz contains {totalQuestions} multiple-choice questions.
                  </p>

                  {totalQuestions > questionsPerPage && (
                    <div className="text-sm text-muted-foreground">
                      Showing {indexOfFirstQuestion + 1}-{Math.min(indexOfLastQuestion, totalQuestions)} of{" "}
                      {totalQuestions}
                    </div>
                  )}
                </div>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  value={openAccordionItem}
                  onValueChange={setOpenAccordionItem}
                >
                  {currentQuestions.map((question) => (
                    <AccordionItem key={question.id} value={question.id}>
                      <QuestionItem
                        question={question}
                        isEditing={editingQuestionId === question.id}
                        editedQuestion={editedQuestion}
                        onStartEditing={startEditingQuestion}
                        onCancelEditing={cancelEditingQuestion}
                        onUpdateContent={updateEditedQuestionContent}
                        onUpdateAnswerContent={updateEditedAnswerContent}
                        onUpdateCorrectAnswer={updateCorrectAnswer}
                        onSaveChanges={saveEditedQuestion}
                      />
                    </AccordionItem>
                  ))}
                </Accordion>

                {totalQuestions > questionsPerPage && (
                  <div className="mt-6 pt-4 border-t">
                    <ClientPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      className="mt-0"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="source" className="pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-lg font-medium mb-2">Source Text</h3>
                      <p className="whitespace-pre-wrap">{quiz.textContent}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex items-start gap-2">
                  <dt className="flex items-center gap-2 font-medium min-w-[120px]">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Created
                  </dt>
                  <dd>{formatDate(quiz.createdAt)}</dd>
                </div>

                {quiz.generatedAt && (
                  <div className="flex items-start gap-2">
                    <dt className="flex items-center gap-2 font-medium min-w-[120px]">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Generated
                    </dt>
                    <dd>{formatDate(quiz.generatedAt)}</dd>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <dt className="flex items-center gap-2 font-medium min-w-[120px]">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Category
                  </dt>
                  <dd>{quiz.category || "Uncategorized"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 py-5 shadow-md hover:shadow-lg">
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Quiz
              </Button>
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 py-5"
              >
                <PenLine className="mr-2 h-5 w-5" />
                Edit Quiz
              </Button>
              <Button
                variant="outline"
                className="w-full border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 py-5"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Quiz
              </Button>
              <Button
                variant="outline"
                className="w-full bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 transition-all duration-200 py-5"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}