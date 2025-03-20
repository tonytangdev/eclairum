"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
  Save,
  X,
  Edit,
  MessageSquare,
  ListChecks,
} from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/dates"
import { ClientPagination } from "@/components/pagination"

// Import the types (these would normally be imported from your domain models)
enum QuizGenerationStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Type definitions for the domain models
interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
  questionId: string;
}

interface Question {
  id: string;
  content: string;
  answers: Answer[];
  quizGenerationTaskId: string;
}

interface Quiz {
  id: string;
  textContent: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  status: QuizGenerationStatus;
  generatedAt: Date;
  userId: string;
  title: string;
  category: string;
}

// Mock data for demonstration
const getMockQuizData = (id: string): Quiz => {
  // Generate more questions for pagination demo
  const baseQuestions = [
    {
      id: "q1",
      content: "What percentage of the solar system's mass does the Sun contain?",
      answers: [
        { id: "a1", content: "50%", isCorrect: false, questionId: "q1" },
        { id: "a2", content: "75%", isCorrect: false, questionId: "q1" },
        { id: "a3", content: "99.8%", isCorrect: true, questionId: "q1" },
        { id: "a4", content: "25%", isCorrect: false, questionId: "q1" },
      ],
      quizGenerationTaskId: id,
    },
    {
      id: "q2",
      content: "Which planets are considered terrestrial planets?",
      answers: [
        { id: "a5", content: "Jupiter, Saturn, Uranus, Neptune", isCorrect: false, questionId: "q2" },
        { id: "a6", content: "Mercury, Venus, Earth, Mars", isCorrect: true, questionId: "q2" },
        { id: "a7", content: "Mercury, Earth, Mars, Jupiter", isCorrect: false, questionId: "q2" },
        { id: "a8", content: "Venus, Earth, Jupiter, Saturn", isCorrect: false, questionId: "q2" },
      ],
      quizGenerationTaskId: id,
    },
    {
      id: "q3",
      content: "What is the Kuiper Belt?",
      answers: [
        { id: "a9", content: "A ring around Saturn", isCorrect: false, questionId: "q3" },
        { id: "a10", content: "A region beyond Neptune containing icy objects", isCorrect: true, questionId: "q3" },
        { id: "a11", content: "A belt of asteroids between Mars and Jupiter", isCorrect: false, questionId: "q3" },
        { id: "a12", content: "The boundary of our solar system", isCorrect: false, questionId: "q3" },
      ],
      quizGenerationTaskId: id,
    },
    {
      id: "q4",
      content: "Which planets are considered gas giants?",
      answers: [
        { id: "a13", content: "Mercury, Venus, Earth, Mars", isCorrect: false, questionId: "q4" },
        { id: "a14", content: "Earth, Mars, Jupiter, Saturn", isCorrect: false, questionId: "q4" },
        { id: "a15", content: "Jupiter, Saturn, Uranus, Neptune", isCorrect: true, questionId: "q4" },
        { id: "a16", content: "Venus, Jupiter, Saturn, Uranus", isCorrect: false, questionId: "q4" },
      ],
      quizGenerationTaskId: id,
    },
  ]

  // Generate additional questions for pagination demo
  const allQuestions = [...baseQuestions]
  for (let i = 5; i <= 15; i++) {
    allQuestions.push({
      id: `q${i}`,
      content: `Sample question ${i} about the solar system?`,
      answers: [
        { id: `a${i}1`, content: "Answer option 1", isCorrect: false, questionId: `q${i}` },
        { id: `a${i}2`, content: "Answer option 2", isCorrect: true, questionId: `q${i}` },
        { id: `a${i}3`, content: "Answer option 3", isCorrect: false, questionId: `q${i}` },
        { id: `a${i}4`, content: "Answer option 4", isCorrect: false, questionId: `q${i}` },
      ],
      quizGenerationTaskId: id,
    })
  }

  return {
    id,
    textContent:
      "The solar system consists of the Sun and everything that orbits around it, including planets, dwarf planets, moons, asteroids, comets, and meteoroids. The Sun is the center of our solar system and contains 99.8% of the solar system's mass. Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. The four inner planets (Mercury, Venus, Earth, and Mars) are called terrestrial planets because they have solid, rocky surfaces. The four outer planets (Jupiter, Saturn, Uranus, and Neptune) are called gas giants because they are large and composed mainly of gas. Beyond Neptune, there is a region called the Kuiper Belt, which contains dwarf planets like Pluto and many other icy objects.",
    questions: allQuestions,
    createdAt: new Date("2023-06-15T10:30:00"),
    updatedAt: new Date("2023-06-15T10:35:00"),
    deletedAt: null,
    status: QuizGenerationStatus.COMPLETED,
    generatedAt: new Date("2023-06-15T10:35:00"),
    userId: "user123",
    title: "Solar System Quiz",
    category: "Astronomy",
  }
}

export default function QuizDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 10
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null)
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("")

  useEffect(() => {
    // In a real app, you would fetch the quiz data from your API
    // For now, we'll use mock data
    setQuiz(getMockQuizData(id))
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Quiz not found</h2>
        <p className="text-muted-foreground">The quiz you&apos;re looking for does not exist or has been deleted.</p>
        <Button asChild>
          <Link href="/my-flash-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Flash Cards
          </Link>
        </Button>
      </div>
    )
  }

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

  // Pagination logic
  const totalQuestions = quiz.questions.length
  const totalPages = Math.ceil(totalQuestions / questionsPerPage)
  const indexOfLastQuestion = currentPage * questionsPerPage
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
  const currentQuestions = quiz.questions.slice(indexOfFirstQuestion, indexOfLastQuestion)

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
    setQuiz((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q) => (q.id === editingQuestionId ? editedQuestion! : q)),
      };
    })
    setEditingQuestionId(null)
    setEditedQuestion(null)
  }

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
            <CardTitle>Quiz Details</CardTitle>
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
                  {currentQuestions.map((question, index) => (
                    <AccordionItem key={question.id} value={question.id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">
                            Question {indexOfFirstQuestion + index + 1}: {question.content}
                          </span>
                          {editingQuestionId !== question.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 ml-2 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingQuestion(question)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4 text-blue-500" />
                              <span>Edit</span>
                            </Button>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {editingQuestionId === question.id ? (
                          <div className="space-y-6 pt-4 bg-blue-50/50 dark:bg-blue-950/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900 transition-all duration-200 animate-in fade-in-50">
                            <div className="flex items-center gap-2 pb-2 border-b border-blue-100 dark:border-blue-900">
                              <PenLine className="h-5 w-5 text-blue-500" />
                              <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Edit Question</h3>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                <Label
                                  htmlFor={`question-${question.id}`}
                                  className="font-medium text-blue-700 dark:text-blue-300"
                                >
                                  Question Text
                                </Label>
                              </div>
                              <div className="relative">
                                <Textarea
                                  id={`question-${question.id}`}
                                  value={editedQuestion!.content}
                                  onChange={(e) => updateEditedQuestionContent(e.target.value)}
                                  className="w-full border-blue-200 dark:border-blue-800 focus:border-blue-400 focus:ring-blue-400 transition-all duration-200"
                                  rows={3}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4 text-blue-500" />
                                <Label className="font-medium text-blue-700 dark:text-blue-300">Answer Options</Label>
                              </div>

                              <div className="bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-900 overflow-hidden">
                                <RadioGroup
                                  value={editedQuestion!.answers.find((a) => a.isCorrect)?.id}
                                  onValueChange={updateCorrectAnswer}
                                  className="divide-y divide-blue-100 dark:divide-blue-900"
                                >
                                  {editedQuestion!.answers.map((answer) => (
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
                                          onChange={(e) => updateEditedAnswerContent(answer.id, e.target.value)}
                                          className={`w-full text-sm ${answer.isCorrect
                                            ? "border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-400"
                                            : "border-gray-200 dark:border-gray-700"
                                            }`}
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100 dark:border-blue-900">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditingQuestion}
                                className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors duration-200"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={saveEditedQuestion}
                                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className={`p-3 rounded-md border ${answer.isCorrect
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                  : "border-muted"
                                  }`}
                              >
                                <div className="flex items-start gap-2">
                                  {answer.isCorrect && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span className={answer.isCorrect ? "font-medium" : ""}>{answer.content}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
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

