import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

interface QuizResultsProps {
  questions: {
    id: string;
    content: string;
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
    }[];
  }[];
  selectedAnswers: string[];
  score: number;
}

export function QuizResults({
  questions,
  selectedAnswers,
  score
}: QuizResultsProps) {
  // Remove onRestart prop since we're reloading the page instead

  const getAnswerContent = (
    question: QuizResultsProps['questions'][0],
    answerId: string
  ) => {
    const answer = question.answers.find(a => a.id === answerId);
    return answer?.content || 'No answer';
  };

  const getCorrectAnswerId = (question: QuizResultsProps['questions'][0]) => {
    const correctAnswer = question.answers.find(answer => answer.isCorrect);
    return correctAnswer?.id || '';
  };

  const handleNewSession = () => {
    // Reload the page to start a new session
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Results</h2>
          <div className="text-center mb-8">
            <p className="text-4xl font-bold mb-2">
              {score} / {questions.length}
            </p>
            <p className="text-muted-foreground">
              {score === questions.length
                ? "Perfect score! Excellent job!"
                : score >= questions.length / 2
                  ? "Good job! You passed the quiz."
                  : "Better luck next time!"}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {questions.map((question, index) => {
              const correctAnswerId = getCorrectAnswerId(question);
              const selectedAnswerId = selectedAnswers[index];
              const isCorrect = question.answers.find(
                a => a.id === selectedAnswerId
              )?.isCorrect || false;

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{question.content}</p>
                      <p className="text-sm text-muted-foreground">
                        Your answer:{" "}
                        <span
                          className={
                            isCorrect
                              ? "text-green-500 font-medium"
                              : "text-red-500 font-medium"
                          }
                        >
                          {getAnswerContent(question, selectedAnswerId)}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-500 font-medium">
                          Correct answer: {getAnswerContent(question, correctAnswerId)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleNewSession} className="w-full">
            Start new flashing session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
