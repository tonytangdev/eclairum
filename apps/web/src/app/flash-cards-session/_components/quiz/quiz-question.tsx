import { Card, CardContent } from "@/components/ui/card";
import { Answer } from "./answer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";

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
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmitAnswer: () => void;
  showOptions: boolean;
  onToggleOptions: () => void;
  isAnswerSubmitted: boolean;
  isCorrect?: boolean;
}

export function QuizQuestion({
  question,
  selectedAnswerId,
  onAnswerSelect,
  inputValue,
  onInputChange,
  onSubmitAnswer,
  showOptions,
  onToggleOptions,
  isAnswerSubmitted,
  isCorrect
}: QuizQuestionProps) {
  const getCorrectAnswer = () => {
    const correctAnswer = question.answers.find(answer => answer.isCorrect);
    return correctAnswer?.content || "";
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">{question.content}</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type your answer here"
              disabled={isAnswerSubmitted}
              className={`flex-1 ${isAnswerSubmitted
                ? isCorrect
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-red-500 bg-red-50 text-red-700"
                : ""
                }`}
            />
            <Button
              onClick={onSubmitAnswer}
              disabled={!inputValue.trim() || isAnswerSubmitted}
            >
              Submit
            </Button>
          </div>

          {isAnswerSubmitted && (
            <div className="flex items-center gap-2 p-2 rounded-md">
              {isCorrect ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Correct!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>Incorrect</span>
                  </div>
                  <div className="text-green-600 font-medium">
                    Correct answer: {getCorrectAnswer()}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={onToggleOptions}
              className="flex items-center gap-1"
              disabled={isAnswerSubmitted}
            >
              <HelpCircle className="h-4 w-4" />
              {showOptions ? "Hide Options" : "Show Options"}
            </Button>
          </div>

          {showOptions && (
            <div className="grid gap-3">
              {question.answers.map((answer) => (
                <Answer
                  key={answer.id}
                  answer={answer}
                  isSelected={selectedAnswerId === answer.id}
                  showResult={isAnswerSubmitted}
                  onClick={onAnswerSelect}
                  disabled={isAnswerSubmitted}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
