"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { MessageSquare, ListChecks, CheckCircle2, Save, X, PlusCircle, PenLine } from "lucide-react"
import { Question } from "../types"

interface QuestionFormProps {
  mode: 'edit' | 'create';
  question: Question | {
    content: string;
    answers: Array<{
      id: string;
      content: string;
      isCorrect: boolean;
    }>;
  };
  onUpdateContent: (content: string) => void;
  onUpdateAnswerContent: (answerId: string, content: string) => void;
  onUpdateCorrectAnswer: (answerId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function QuestionForm({
  mode,
  question,
  onUpdateContent,
  onUpdateAnswerContent,
  onUpdateCorrectAnswer,
  onSave,
  onCancel
}: QuestionFormProps) {
  const isCreate = mode === 'create';
  const iconColor = isCreate ? 'green' : 'blue';
  const icon = isCreate ? <PlusCircle className={`h-5 w-5 text-${iconColor}-500`} /> : <PenLine className={`h-5 w-5 text-${iconColor}-500`} />;
  const title = isCreate ? 'Add New Question' : 'Edit Question';
  const saveButtonText = isCreate ? 'Add Question' : 'Save Changes';
  const formId = isCreate ? 'new-question' : `question-${(question as Question).id || 'new'}`;

  const isValid = question.content.trim() !== '' &&
    question.answers.every(a => a.content.trim() !== '') &&
    question.answers.some(a => a.isCorrect);

  return (
    <div className={`space-y-6 pt-4 bg-${iconColor}-50/50 dark:bg-${iconColor}-950/10 p-6 rounded-lg border border-${iconColor}-100 dark:border-${iconColor}-900 transition-all duration-200 animate-in fade-in-50`}>
      <div className={`flex items-center gap-2 pb-2 border-b border-${iconColor}-100 dark:border-${iconColor}-900`}>
        {icon}
        <h3 className={`text-lg font-medium text-${iconColor}-700 dark:text-${iconColor}-300`}>{title}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className={`h-4 w-4 text-${iconColor}-500`} />
          <Label
            htmlFor={formId}
            className={`font-medium text-${iconColor}-700 dark:text-${iconColor}-300`}
          >
            Question Text
          </Label>
        </div>
        <div className="relative">
          <Textarea
            id={formId}
            value={question.content}
            onChange={(e) => onUpdateContent(e.target.value)}
            className={`w-full border-${iconColor}-200 dark:border-${iconColor}-800 focus:border-${iconColor}-400 focus:ring-${iconColor}-400 transition-all duration-200`}
            rows={3}
            placeholder="Enter your question here..."
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className={`h-4 w-4 text-${iconColor}-500`} />
          <Label className={`font-medium text-${iconColor}-700 dark:text-${iconColor}-300`}>Answer Options</Label>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <RadioGroup
            value={question.answers.find((a) => a.isCorrect)?.id}
            onValueChange={onUpdateCorrectAnswer}
            className="divide-y divide-gray-200 dark:divide-gray-700"
          >
            {question.answers.map((answer, ansIndex) => (
              <div
                key={answer.id}
                className={`flex items-start p-4 transition-colors duration-200 ${answer.isCorrect
                  ? "bg-green-50 dark:bg-green-950/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
              >
                <div className="flex items-center h-5 mt-1">
                  <RadioGroupItem
                    value={answer.id}
                    id={answer.id}
                    className="text-green-600 focus:ring-green-500"
                  />
                </div>
                <div className="ml-3 flex-1 space-y-1">
                  <Label
                    htmlFor={answer.id}
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
                    onChange={(e) => onUpdateAnswerContent(answer.id, e.target.value)}
                    className={`w-full text-sm ${answer.isCorrect
                      ? "border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-400"
                      : "border-gray-200 dark:border-gray-700"
                      }`}
                    rows={2}
                    placeholder={`Answer option ${ansIndex + 1}`}
                  />
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={!isValid}
          className={`bg-${iconColor}-600 hover:bg-${iconColor}-700 text-white transition-colors duration-200 disabled:bg-${iconColor}-300 disabled:cursor-not-allowed`}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveButtonText}
        </Button>
      </div>
    </div>
  );
}
