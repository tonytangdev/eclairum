"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { MessageSquare, ListChecks, CheckCircle2, Save, X, PlusCircle, PenLine, Loader2 } from "lucide-react"
import { Question, Answer } from "../types"
import { cn } from "@/lib/utils"

// Represents an answer in a new question that doesn't have an ID yet
interface NewAnswer {
  content: string;
  isCorrect: boolean;
}

// Create a union type to handle both existing and new answers
type AnswerWithOptionalId = Answer | NewAnswer;

// Helper type guard to check if an answer has an ID
function hasId(answer: AnswerWithOptionalId): answer is Answer {
  return 'id' in answer && typeof answer.id === 'string';
}

interface QuestionFormProps {
  mode: 'edit' | 'create';
  question: Question | {
    content: string;
    answers: Array<NewAnswer>;
  };
  onUpdateContent: (content: string) => void;
  onUpdateAnswerContent: (answerId: string | number, content: string) => void;
  onUpdateCorrectAnswer: (answerId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function QuestionForm({
  mode,
  question,
  onUpdateContent,
  onUpdateAnswerContent,
  onUpdateCorrectAnswer,
  onSave,
  onCancel,
  isSubmitting = false
}: QuestionFormProps) {
  const isCreate = mode === 'create';
  const formId = isCreate ? 'new-question' : `question-${isCreate ? '' : (question as Question).id}`;

  const isValid = question.content.trim() !== '' &&
    question.answers.every(a => a.content.trim() !== '') &&
    question.answers.some(a => a.isCorrect);

  return (
    <div className={cn(
      "space-y-6 p-6 rounded-lg border bg-card shadow-sm",
      isCreate ? "bg-green-50/50 border-green-100 dark:bg-green-950/10 dark:border-green-900" :
        "bg-blue-50/50 border-blue-100 dark:bg-blue-950/10 dark:border-blue-900"
    )}>
      <div className={cn(
        "flex items-center gap-2 pb-2 border-b",
        isCreate ? "border-green-100 dark:border-green-900" : "border-blue-100 dark:border-blue-900"
      )}>
        {isCreate ? (
          <PlusCircle className="h-5 w-5 text-green-500" />
        ) : (
          <PenLine className="h-5 w-5 text-blue-500" />
        )}
        <h3 className={cn(
          "text-lg font-medium",
          isCreate ? "text-green-700 dark:text-green-300" : "text-blue-700 dark:text-blue-300"
        )}>
          {isCreate ? 'Add New Question' : 'Edit Question'}
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className={cn("h-4 w-4", isCreate ? "text-green-500" : "text-blue-500")} />
          <Label
            htmlFor={formId}
            className={cn(
              "font-medium",
              isCreate ? "text-green-700 dark:text-green-300" : "text-blue-700 dark:text-blue-300"
            )}
          >
            Question Text
          </Label>
        </div>
        <div className="relative">
          <Textarea
            id={formId}
            value={question.content}
            onChange={(e) => onUpdateContent(e.target.value)}
            className={cn(
              "w-full transition-all duration-200",
              isCreate ? "border-green-200 focus:border-green-400 focus:ring-green-400 dark:border-green-800" :
                "border-blue-200 focus:border-blue-400 focus:ring-blue-400 dark:border-blue-800"
            )}
            rows={3}
            placeholder="Enter your question here..."
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className={`h-4 w-4 text-${isCreate ? "green" : "blue"}-500`} />
          <Label className={`font-medium text-${isCreate ? "green" : "blue"}-700 dark:text-${isCreate ? "green" : "blue"}-300`}>Answer Options</Label>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <RadioGroup
            value={isCreate ?
              question.answers.findIndex(a => a.isCorrect).toString() :
              (question.answers.find(a => a.isCorrect) && hasId(question.answers.find(a => a.isCorrect) as AnswerWithOptionalId) ?
                (question.answers.find(a => a.isCorrect) as Answer).id : '')
            }
            onValueChange={onUpdateCorrectAnswer}
            className="divide-y divide-gray-200 dark:divide-gray-700"
          >
            {question.answers.map((answer, index) => {
              const answerId = hasId(answer) ? answer.id : `answer-${index}`;
              const valueForRadio = isCreate ? index.toString() : (hasId(answer) ? answer.id : index.toString());

              return (
                <div
                  key={answerId}
                  className={`flex items-start p-4 transition-colors duration-200 ${answer.isCorrect
                    ? "bg-green-50 dark:bg-green-950/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                  <div className="flex items-center h-5 mt-1">
                    <RadioGroupItem
                      value={valueForRadio}
                      id={answerId}
                      className="text-green-600 focus:ring-green-500"
                    />
                  </div>
                  <div className="ml-3 flex-1 space-y-1">
                    <Label
                      htmlFor={answerId}
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
                      onChange={(e) => onUpdateAnswerContent(isCreate ? index : (hasId(answer) ? answer.id : index), e.target.value)}
                      className={`w-full text-sm ${answer.isCorrect
                        ? "border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-400"
                        : "border-gray-200 dark:border-gray-700"
                        }`}
                      rows={2}
                      placeholder={`Answer option ${index + 1}`}
                    />
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant={isCreate ? "default" : "default"}
          size="sm"
          onClick={onSave}
          disabled={!isValid || isSubmitting}
          className={cn(
            "text-white transition-colors duration-200",
            isCreate ?
              "bg-green-600 hover:bg-green-700 disabled:bg-green-300" :
              "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300",
            "disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isCreate ? 'Adding...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isCreate ? 'Add Question' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
