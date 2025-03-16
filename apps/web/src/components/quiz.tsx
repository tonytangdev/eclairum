"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

// Quiz data
const quizData = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: "Paris",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Venus"],
    correctAnswer: "Mars",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
  },
]

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(Array(quizData.length).fill(""))
  const [showResults, setShowResults] = useState(false)

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswers(Array(quizData.length).fill(""))
    setShowResults(false)
  }

  const calculateScore = () => {
    return quizData.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.correctAnswer ? 1 : 0)
    }, 0)
  }

  if (showResults) {
    const score = calculateScore()

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
            <div className="text-center mb-8">
              <p className="text-4xl font-bold mb-2">
                {score} / {quizData.length}
              </p>
              <p className="text-muted-foreground">
                {score === quizData.length
                  ? "Perfect score! Excellent job!"
                  : score >= quizData.length / 2
                    ? "Good job! You passed the quiz."
                    : "Better luck next time!"}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {quizData.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    {selectedAnswers[index] === question.correctAnswer ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-muted-foreground">
                        Your answer:{" "}
                        <span
                          className={
                            selectedAnswers[index] === question.correctAnswer
                              ? "text-green-500 font-medium"
                              : "text-red-500 font-medium"
                          }
                        >
                          {selectedAnswers[index] || "No answer"}
                        </span>
                      </p>
                      {selectedAnswers[index] !== question.correctAnswer && (
                        <p className="text-sm text-green-500 font-medium">Correct answer: {question.correctAnswer}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleRestart} className="w-full">
              Restart Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuizData = quizData[currentQuestion]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium">
          Question {currentQuestion + 1} of {quizData.length}
        </span>
        <span className="text-sm text-muted-foreground">
          {selectedAnswers.filter(Boolean).length} of {quizData.length} answered
        </span>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">{currentQuizData.question}</h2>

          <div className="grid gap-3">
            {currentQuizData.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === option
              const isCorrect = option === currentQuizData.correctAnswer
              const showResult = selectedAnswers[currentQuestion]

              let buttonClass = "justify-start text-left h-auto py-4 px-6 "

              if (showResult) {
                if (isSelected && isCorrect) {
                  buttonClass += "bg-green-100 border-green-500 text-green-700 "
                } else if (isSelected && !isCorrect) {
                  buttonClass += "bg-red-100 border-red-500 text-red-700 "
                } else if (isCorrect) {
                  buttonClass += "bg-green-100 border-green-500 text-green-700 "
                }
              } else if (isSelected) {
                buttonClass += "border-primary "
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={buttonClass}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!selectedAnswers[currentQuestion]}
                >
                  <div className="flex items-center w-full">
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-500 ml-2" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 ml-2" />}
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestion]}>
          {currentQuestion === quizData.length - 1 ? "See Results" : "Next"}
        </Button>
      </div>
    </div>
  )
}

