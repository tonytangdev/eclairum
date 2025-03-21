"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizProgress } from "./quiz-progress";
import { QuizQuestion } from "./quiz-question";
import { QuizResults } from "./quiz-results";
import { submitAnswer } from "@/app/flash-cards-session/_actions/submit-answer";

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
  const [submissionErrors, setSubmissionErrors] = useState<string[]>(Array(questions.length).fill(""));

  const handleAnswerSelect = async (answerId: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerId;
    setSelectedAnswers(newAnswers);

    // Submit the answer to the backend
    const currentQuestionId = questions[currentQuestion].id;
    const result = await submitAnswer({
      questionId: currentQuestionId,
      answerId: answerId,
    });

    // If there was an error submitting the answer, store it
    if (!result.success) {
      const newErrors = [...submissionErrors];
      newErrors[currentQuestion] = result.error || "Failed to submit answer";
      setSubmissionErrors(newErrors);
      console.error(`Error submitting answer for question ${currentQuestionId}:`, result.error);
    }
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
