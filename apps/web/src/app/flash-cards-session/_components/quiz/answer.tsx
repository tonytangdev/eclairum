import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface AnswerProps {
  answer: {
    id: string;
    content: string;
    isCorrect: boolean;
  };
  isSelected: boolean;
  showResult: boolean;
  onClick: (answerId: string) => void;
  disabled: boolean;
}

export function Answer({
  answer,
  isSelected,
  showResult,
  onClick,
  disabled
}: AnswerProps) {
  const { id, content, isCorrect } = answer;

  let buttonClass = "justify-start text-left h-auto py-4 px-6 w-full ";

  if (showResult) {
    if (isSelected && isCorrect) {
      buttonClass += "bg-green-100 border-green-500 text-green-700 ";
    } else if (isSelected && !isCorrect) {
      buttonClass += "bg-red-100 border-red-500 text-red-700 ";
    } else if (isCorrect) {
      buttonClass += "bg-green-100 border-green-500 text-green-700 ";
    }
  } else if (isSelected) {
    buttonClass += "border-primary ";
  }

  return (
    <Button
      variant="outline"
      className={buttonClass}
      onClick={() => onClick(id)}
      disabled={disabled}
    >
      <div className="flex items-center w-full">
        <span className="flex-1 overflow-hidden whitespace-normal break-words text-left">{content}</span>
        {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />}
        {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500 ml-2 flex-shrink-0" />}
      </div>
    </Button>
  );
}
