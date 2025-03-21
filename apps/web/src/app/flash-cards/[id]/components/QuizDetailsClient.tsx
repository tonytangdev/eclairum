"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Tag,
  PlayCircle,
  Trash2,
  Save,
  X,
  MessageSquare,
  ListChecks,
  PlusCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/dates"
import { ClientPagination } from "@/components/pagination"
import { Quiz, Question } from "../types"
import QuestionItem from "./QuestionItem"
import { StatusBadge } from "@/components/flash-cards/status-badge"
import { deleteQuizGenerationTaskServer } from "../server-actions"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
      answers: prev.answers.map((a: any) => (a.id === answerId ? { ...a, content } : a)),
    }))
  }

  const updateNewCorrectAnswer = (answerId: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((a: any) => ({ ...a, isCorrect: a.id === answerId })),
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
      quizGenerationTaskId: id,
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

  const isNewQuestionValid = () => {
    return (
      newQuestion.content.trim() !== "" &&
      newQuestion.answers.every((a) => a.content.trim() !== "") &&
      newQuestion.answers.some((a) => a.isCorrect)
    )
  }

  // Pagination logic
  const totalQuestions = quiz.questions.length
  const totalPages = Math.ceil(totalQuestions / questionsPerPage)
  const indexOfLastQuestion = currentPage * questionsPerPage
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
  const currentQuestions = quiz.questions.slice(indexOfFirstQuestion, indexOfLastQuestion)

  const handleDeleteQuiz = async () => {
    setIsDeleting(true)

    try {
      const result = await deleteQuizGenerationTaskServer(quiz.id)

      if (result.success) {
        toast("Quiz deleted")
        router.push("/flash-cards")
      } else {
        toast("Failed to delete quiz")
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error)
      toast("Error")
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
                  <div className="space-y-6 mb-6 bg-green-50/50 dark:bg-green-950/10 p-6 rounded-lg border border-green-100 dark:border-green-900 transition-all duration-200 animate-in fade-in-50 slide-in-from-top-5">
                    <div className="flex items-center gap-2 pb-2 border-b border-green-100 dark:border-green-900">
                      <PlusCircle className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-medium text-green-700 dark:text-green-300">Add New Question</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <Label htmlFor="new-question" className="font-medium text-green-700 dark:text-green-300">
                          Question Text
                        </Label>
                      </div>
                      <div className="relative">
                        <Textarea
                          id="new-question"
                          value={newQuestion.content}
                          onChange={(e) => updateNewQuestionContent(e.target.value)}
                          className="w-full border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-400 transition-all duration-200"
                          rows={3}
                          placeholder="Enter your question here..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-green-500" />
                        <Label className="font-medium text-green-700 dark:text-green-300">Answer Options</Label>
                      </div>

                      <div className="bg-white dark:bg-gray-900 rounded-lg border border-green-100 dark:border-green-900 overflow-hidden">
                        <RadioGroup
                          value={newQuestion.answers.find((a: {
                            id: string;
                            content: string;
                            isCorrect: boolean;
                          }) => a.isCorrect)?.id}
                          onValueChange={updateNewCorrectAnswer}
                          className="divide-y divide-green-100 dark:divide-green-900"
                        >
                          {newQuestion.answers.map((answer: {
                            id: string;
                            content: string;
                            isCorrect: boolean;
                          }, ansIndex: number) => (
                            <div
                              key={answer.id}
                              className={`flex items-start p-4 transition-colors duration-200 ${answer.isCorrect
                                ? "bg-green-50 dark:bg-green-950/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                              <div className="flex items-center h-5 mt-1">
                                <RadioGroupItem
                                  value={answer.id}
                                  id={answer.id}
                                  className="text-green-600 focus:ring-green-500"
                                />
                              </div>
                              <div className="ml-3 flex-1 space-y-1">
                                <Label
                                  htmlFor={answer.id}
                                  className={`font-medium ${answer.isCorrect
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                  {answer.isCorrect ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      Correct Answer
                                    </span>
                                  ) : (
                                    "Mark as correct"
                                  )}
                                </Label>
                                <Textarea
                                  value={answer.content}
                                  onChange={(e) => updateNewAnswerContent(answer.id, e.target.value)}
                                  className={`w-full text-sm ${answer.isCorrect
                                    ? "border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-400"
                                    : "border-gray-200 dark:border-gray-700"
                                    }`}
                                  rows={2}
                                  placeholder={`Answer option ${ansIndex + 1}`}
                                />
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-green-100 dark:border-green-900">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelAddingQuestion}
                        className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors duration-200"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={saveNewQuestion}
                        disabled={!isNewQuestionValid()}
                        className="bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Add Question
                      </Button>
                    </div>
                  </div>
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