"use client"

import { AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Edit, PenLine, MessageSquare, ListChecks, CheckCircle2, Save, X } from "lucide-react"
import { Question } from "../types"

interface QuestionItemProps {
  question: Question
  isEditing: boolean
  editedQuestion: Question | null
  onStartEditing: (question: Question) => void
  onCancelEditing: () => void
  onUpdateContent: (content: string) => void
  onUpdateAnswerContent: (answerId: string, content: string) => void
  onUpdateCorrectAnswer: (answerId: string) => void
  onSaveChanges: () => void
}

export default function QuestionItem({
  question,
  isEditing,
  editedQuestion,
  onStartEditing,
  onCancelEditing,
  onUpdateContent,
  onUpdateAnswerContent,
  onUpdateCorrectAnswer,
  onSaveChanges
}: QuestionItemProps) {
  return (
    <>
      <AccordionTrigger className="text-left">
        <div className="flex items-center justify-between w-full pr-4">
          <span className="font-medium">
            {question.content}
          </span>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 ml-2 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                onStartEditing(question)
              }}
            >
              <Edit className="mr-2 h-4 w-4 text-blue-500" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {isEditing ? (
          <div className="space-y-6 pt-4 bg-blue-50/50 dark:bg-blue-950/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900 transition-all duration-200 animate-in fade-in-50">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-100 dark:border-blue-900">
              <PenLine className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">Edit Question</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <Label
                  htmlFor={`question-${question.id}`}
                  className="font-medium text-blue-700 dark:text-blue-300"
                >
                  Question Text
                </Label>
              </div>
              <div className="relative">
                <Textarea
                  id={`question-${question.id}`}
                  value={editedQuestion!.content}
                  onChange={(e) => onUpdateContent(e.target.value)}
                  className="w-full border-blue-200 dark:border-blue-800 focus:border-blue-400 focus:ring-blue-400 transition-all duration-200"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-blue-500" />
                <Label className="font-medium text-blue-700 dark:text-blue-300">Answer Options</Label>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-900 overflow-hidden">
                <RadioGroup
                  value={editedQuestion!.answers.find((a) => a.isCorrect)?.id}
                  onValueChange={onUpdateCorrectAnswer}
                  className="divide-y divide-blue-100 dark:divide-blue-900"
                >
                  {editedQuestion!.answers.map((answer) => (
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
                        />
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100 dark:border-blue-900">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelEditing}
                className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onSaveChanges}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {question.answers.map((answer) => (
              <div
                key={answer.id}
                className={`p-3 rounded-md border ${answer.isCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-muted"
                  }`}
              >
                <div className="flex items-start gap-2">
                  {answer.isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={answer.isCorrect ? "font-medium" : ""}>{answer.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </>
  )
}
