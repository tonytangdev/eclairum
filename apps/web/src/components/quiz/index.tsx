"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizProgress } from "./quiz-progress";
import { QuizQuestion } from "./quiz-question";
import { QuizResults } from "./quiz-results";

interface QuizProps {
  questions: {
    id: string;
    content: string;
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
    }[];
  }[];
}

export default function Quiz({ questions }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (answerId: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerId;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(Array(questions.length).fill(""));
    setShowResults(false);
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      const selectedAnswerId = selectedAnswers[index];
      const selectedAnswer = question.answers.find(answer => answer.id === selectedAnswerId);
      return score + (selectedAnswer?.isCorrect ? 1 : 0);
    }, 0);
  };

  if (showResults) {
    return (
      <QuizResults
        questions={questions}
        selectedAnswers={selectedAnswers}
        score={calculateScore()}
        onRestart={handleRestart}
      />
    );
  }

  const currentQuestionItem = questions[currentQuestion];
  const answeredCount = selectedAnswers.filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      <QuizProgress
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
      />

      <QuizQuestion
        question={currentQuestionItem}
        selectedAnswerId={selectedAnswers[currentQuestion]}
        onAnswerSelect={handleAnswerSelect}
      />

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!selectedAnswers[currentQuestion]}
        >
          {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
        </Button>
      </div>
    </div>
  );
}
