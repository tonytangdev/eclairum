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
  const [inputAnswers, setInputAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [submittedAnswers, setSubmittedAnswers] = useState<boolean[]>(Array(questions.length).fill(false));
  const [showOptions, setShowOptions] = useState<boolean[]>(Array(questions.length).fill(false));
  const [showResults, setShowResults] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<string[]>(Array(questions.length).fill(""));

  const handleInputChange = (value: string) => {
    const newInputAnswers = [...inputAnswers];
    newInputAnswers[currentQuestion] = value;
    setInputAnswers(newInputAnswers);
  };

  const handleAnswerSelect = async (answerId: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerId;
    setSelectedAnswers(newAnswers);

    // Also update input to match selected answer
    const answer = questions[currentQuestion].answers.find(a => a.id === answerId);
    if (answer) {
      const newInputAnswers = [...inputAnswers];
      newInputAnswers[currentQuestion] = answer.content;
      setInputAnswers(newInputAnswers);
    }

    await submitAnswerToBackend(answerId);
    markAnswerSubmitted();
  };

  const handleSubmitAnswer = async () => {
    if (!inputAnswers[currentQuestion].trim()) return;

    // Find if any answer matches the input (case insensitive)
    const matchingAnswer = questions[currentQuestion].answers.find(
      a => a.content.toLowerCase() === inputAnswers[currentQuestion].trim().toLowerCase()
    );

    if (matchingAnswer) {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentQuestion] = matchingAnswer.id;
      setSelectedAnswers(newAnswers);

      await submitAnswerToBackend(matchingAnswer.id);
    } else {
      // If no match, just mark as submitted without a selected answer ID
      console.log("No matching answer found for input:", inputAnswers[currentQuestion]);
    }

    markAnswerSubmitted();
  };

  const submitAnswerToBackend = async (answerId: string) => {
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

    return result;
  };

  const markAnswerSubmitted = () => {
    const newSubmitted = [...submittedAnswers];
    newSubmitted[currentQuestion] = true;
    setSubmittedAnswers(newSubmitted);
  };

  const handleToggleOptions = () => {
    const newShowOptions = [...showOptions];
    newShowOptions[currentQuestion] = !newShowOptions[currentQuestion];
    setShowOptions(newShowOptions);
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

  const isCurrentAnswerCorrect = () => {
    const selectedId = selectedAnswers[currentQuestion];
    if (!selectedId) return false;

    const selectedAnswer = questions[currentQuestion].answers.find(
      answer => answer.id === selectedId
    );

    return !!selectedAnswer?.isCorrect;
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
  const answeredCount = submittedAnswers.filter(Boolean).length;

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
        inputValue={inputAnswers[currentQuestion]}
        onInputChange={handleInputChange}
        onSubmitAnswer={handleSubmitAnswer}
        showOptions={showOptions[currentQuestion]}
        onToggleOptions={handleToggleOptions}
        isAnswerSubmitted={submittedAnswers[currentQuestion]}
        isCorrect={isCurrentAnswerCorrect()}
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
          disabled={!submittedAnswers[currentQuestion]}
        >
          {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
        </Button>
      </div>
    </div>
  );
}
