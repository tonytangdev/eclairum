interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  answeredCount
}: QuizProgressProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm font-medium">
        Question {currentQuestion + 1} of {totalQuestions}
      </span>
      <span className="text-sm text-muted-foreground">
        {answeredCount} of {totalQuestions} answered
      </span>
    </div>
  );
}
