import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ClientPagination } from "@/components/pagination"
import { Question } from "../types"
import QuestionItem from "./QuestionItem"
import QuestionForm from "./QuestionForm"
import { useQuestionManagement, usePagination } from "../_hooks"

interface QuestionsTabProps {
  quizId: string;
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

export function QuestionsTab({ quizId, questions, onQuestionsChange }: QuestionsTabProps) {
  const {
    questions: managedQuestions,
    // setQuestions,
    editingQuestionId,
    editedQuestion,
    openAccordionItem,
    setOpenAccordionItem,
    isAddingQuestion,
    newQuestion,
    startEditingQuestion,
    cancelEditingQuestion,
    updateEditedQuestionContent,
    updateEditedAnswerContent,
    updateEditedCorrectAnswer,
    saveEditedQuestion,
    startAddingQuestion,
    cancelAddingQuestion,
    updateNewQuestionContent,
    updateNewAnswerContent,
    updateNewCorrectAnswer,
    saveNewQuestion,
  } = useQuestionManagement(quizId, questions);

  const questionsPerPage = 10;
  const {
    currentPage,
    totalPages,
    totalItems: totalQuestions,
    currentItems: currentQuestions,
    setCurrentPage
    // indexOfFirstItem: indexOfFirstQuestion,
    // indexOfLastItem: indexOfLastQuestion,
  } = usePagination(managedQuestions, questionsPerPage);

  // Update parent component when questions change
  const handleSaveQuestion = () => {
    saveEditedQuestion();
    onQuestionsChange(managedQuestions);
  };

  const handleAddQuestion = () => {
    saveNewQuestion();
    onQuestionsChange(managedQuestions);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          This quiz contains {totalQuestions} multiple-choice questions.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={startAddingQuestion}
          className="bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-700 transition-colors duration-200"
        >
          <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
          Add Question
        </Button>
      </div>

      {isAddingQuestion && (
        <QuestionForm
          mode="create"
          question={newQuestion}
          onUpdateContent={updateNewQuestionContent}
          onUpdateAnswerContent={updateNewAnswerContent}
          onUpdateCorrectAnswer={updateNewCorrectAnswer}
          onSave={handleAddQuestion}
          onCancel={cancelAddingQuestion}
        />
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={openAccordionItem}
        onValueChange={setOpenAccordionItem}
      >
        {currentQuestions.map((question) => (
          <AccordionItem key={question.id} value={question.id}>
            {editingQuestionId === question.id && editedQuestion ? (
              <QuestionForm
                mode="edit"
                question={editedQuestion}
                onUpdateContent={updateEditedQuestionContent}
                onUpdateAnswerContent={updateEditedAnswerContent}
                onUpdateCorrectAnswer={updateEditedCorrectAnswer}
                onSave={handleSaveQuestion}
                onCancel={cancelEditingQuestion}
              />
            ) : (
              <QuestionItem
                question={question}
                onStartEditing={startEditingQuestion}
              />
            )}
          </AccordionItem>
        ))}
      </Accordion>

      {totalQuestions > questionsPerPage && (
        <div className="mt-6 pt-4 border-t">
          <ClientPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-0"
          />
        </div>
      )}
    </div>
  )
}
