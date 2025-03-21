"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Tag,
  PlayCircle,
  Trash2,
  Loader2,
  PlusCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/dates"
import { ClientPagination } from "@/components/pagination"
import { Quiz, Question } from "../types"
import QuestionItem from "./QuestionItem"
import QuestionForm from "./QuestionForm"
import { StatusBadge } from "@/components/flash-cards/status-badge"
import { deleteQuizGenerationTaskServer } from "../server-actions"
import { toast } from "sonner"

interface QuizDetailsClientProps {
  initialQuiz: Quiz;
}

export default function QuizDetailsClient({ initialQuiz }: QuizDetailsClientProps) {
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz)
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 10
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null)
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    content: "",
    answers: [
      { id: `new-a1-${Date.now()}`, content: "", isCorrect: true },
      { id: `new-a2-${Date.now()}`, content: "", isCorrect: false },
      { id: `new-a3-${Date.now()}`, content: "", isCorrect: false },
      { id: `new-a4-${Date.now()}`, content: "", isCorrect: false },
    ],
  })

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

  // New question functions
  const startAddingQuestion = () => {
    setIsAddingQuestion(true)
    // Reset the new question form
    setNewQuestion({
      content: "",
      answers: [
        { id: `new-a1-${Date.now()}`, content: "", isCorrect: true },
        { id: `new-a2-${Date.now()}`, content: "", isCorrect: false },
        { id: `new-a3-${Date.now()}`, content: "", isCorrect: false },
        { id: `new-a4-${Date.now()}`, content: "", isCorrect: false },
      ],
    })
  }

  const cancelAddingQuestion = () => {
    setIsAddingQuestion(false)
  }

  const updateNewQuestionContent = (content: string) => {
    setNewQuestion((prev) => ({ ...prev, content }))
  }

  const updateNewAnswerContent = (answerId: string, content: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((a) => (a.id === answerId ? { ...a, content } : a)),
    }))
  }

  const updateNewCorrectAnswer = (answerId: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((a) => ({ ...a, isCorrect: a.id === answerId })),
    }))
  }

  const saveNewQuestion = () => {
    const newQuestionId = `q${Date.now()}`
    const newQuestionObj = {
      id: newQuestionId,
      content: newQuestion.content,
      answers: newQuestion.answers.map((a) => ({
        ...a,
        questionId: newQuestionId,
      })),
      quizGenerationTaskId: quiz.id,
    }

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestionObj],
    }))

    setIsAddingQuestion(false)

    // If adding a question would create a new page, navigate to that page
    if (quiz.questions.length % questionsPerPage === 0) {
      setCurrentPage(Math.ceil((quiz.questions.length + 1) / questionsPerPage))
    }
  }

  // Pagination logic
  const totalQuestions = quiz.questions.length
  const totalPages = Math.ceil(totalQuestions / questionsPerPage)
  const indexOfLastQuestion = currentPage * questionsPerPage
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
  const currentQuestions = quiz.questions.slice(indexOfFirstQuestion, indexOfLastQuestion)

  const handleDeleteQuiz = async () => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteQuizGenerationTaskServer(quiz.id)

      if (result.success) {
        toast("Quiz deleted successfully")
        router.push("/flash-cards")
      } else {
        toast("Failed to delete quiz")
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error)
      toast("Error deleting quiz")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startAddingQuestion}
                    className="bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-700 transition-colors duration-200"
                  >
                    <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                    Add Question
                  </Button>
                </div>

                {isAddingQuestion && (
                  <QuestionForm
                    mode="create"
                    question={newQuestion}
                    onUpdateContent={updateNewQuestionContent}
                    onUpdateAnswerContent={updateNewAnswerContent}
                    onUpdateCorrectAnswer={updateNewCorrectAnswer}
                    onSave={saveNewQuestion}
                    onCancel={cancelAddingQuestion}
                  />
                )}

                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  value={openAccordionItem}
                  onValueChange={setOpenAccordionItem}
                >
                  {currentQuestions.map((question) => (
                    <AccordionItem key={question.id} value={question.id}>
                      {editingQuestionId === question.id && editedQuestion ? (
                        <QuestionForm
                          mode="edit"
                          question={editedQuestion}
                          onUpdateContent={updateEditedQuestionContent}
                          onUpdateAnswerContent={updateEditedAnswerContent}
                          onUpdateCorrectAnswer={updateCorrectAnswer}
                          onSave={saveEditedQuestion}
                          onCancel={cancelEditingQuestion}
                        />
                      ) : (
                        <QuestionItem
                          question={question}
                          onStartEditing={startEditingQuestion}
                        />
                      )}
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

                <div className="flex items-start gap-2">
                  <dt className="flex items-center gap-2 font-medium min-w-[120px]">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Category
                  </dt>
                  <dd>{quiz.category || "No category"}</dd>
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
                className="w-full bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 transition-all duration-200 py-5"
                disabled={isDeleting}
                onClick={handleDeleteQuiz}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-5 w-5" />
                )}
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}