import { Card, CardContent } from "@/components/ui/card";
import { Answer } from "./answer";

interface QuizQuestionProps {
  question: {
    id: string;
    content: string;
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
    }[];
  };
  selectedAnswerId: string;
  onAnswerSelect: (answerId: string) => void;
}

export function QuizQuestion({
  question,
  selectedAnswerId,
  onAnswerSelect
}: QuizQuestionProps) {
  const showResult = !!selectedAnswerId;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">{question.content}</h2>

        <div className="grid gap-3">
          {question.answers.map((answer) => (
            <Answer
              key={answer.id}
              answer={answer}
              isSelected={selectedAnswerId === answer.id}
              showResult={showResult}
              onClick={onAnswerSelect}
              disabled={showResult}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
