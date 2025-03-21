"use client"

import { AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Edit, CheckCircle2 } from "lucide-react"
import { Question } from "../types"

interface QuestionItemProps {
  question: Question;
  onStartEditing: (question: Question) => void;
}

export default function QuestionItem({
  question,
  onStartEditing
}: QuestionItemProps) {
  return (
    <>
      <AccordionTrigger className="text-left">
        <div className="flex items-center justify-between w-full pr-4">
          <span className="font-medium">
            {question.content}
          </span>
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
        </div>
      </AccordionTrigger>
      <AccordionContent>
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
      </AccordionContent>
    </>
  )
}
