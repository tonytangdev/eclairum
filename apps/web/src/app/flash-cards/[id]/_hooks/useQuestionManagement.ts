import { useState, useCallback } from "react";
import { Question } from "../types";
import { toast } from "sonner";
import { addQuestion } from "../_actions/add-question";

export function useQuestionManagement(
  quizId: string,
  initialQuestions: Question[],
) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [openAccordionItem, setOpenAccordionItem] = useState<string>("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize empty question structure for the form without IDs
  const [newQuestion, setNewQuestion] = useState<{
    content: string;
    answers: Array<{
      content: string;
      isCorrect: boolean;
    }>;
  }>({
    content: "",
    answers: [
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ],
  });

  // Start editing a question
  const startEditingQuestion = useCallback((question: Question) => {
    setEditingQuestionId(question.id);
    setEditedQuestion(JSON.parse(JSON.stringify(question)));
  }, []);

  // Cancel editing a question
  const cancelEditingQuestion = useCallback(() => {
    setEditingQuestionId(null);
    setEditedQuestion(null);
  }, []);

  // Update the edited question content
  const updateEditedQuestionContent = useCallback((content: string) => {
    setEditedQuestion((prev) => (prev ? { ...prev, content } : null));
  }, []);

  // Update an answer's content in the edited question
  const updateEditedAnswerContent = useCallback(
    (answerId: string, content: string) => {
      setEditedQuestion((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          answers: prev.answers.map((a) =>
            a.id === answerId ? { ...a, content } : a,
          ),
        };
      });
    },
    [],
  );

  // Update which answer is correct in the edited question
  const updateEditedCorrectAnswer = useCallback((answerId: string) => {
    setEditedQuestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: prev.answers.map((a) => ({
          ...a,
          isCorrect: a.id === answerId,
        })),
      };
    });
  }, []);

  // Save the edited question
  const saveEditedQuestion = useCallback(() => {
    if (!editedQuestion) return;

    setQuestions((prev) =>
      prev.map((q) => (q.id === editingQuestionId ? editedQuestion : q)),
    );

    setEditingQuestionId(null);
    setEditedQuestion(null);
    toast.success("Question updated successfully");
  }, [editedQuestion, editingQuestionId]);

  // Start adding a new question without assigning IDs
  const startAddingQuestion = useCallback(() => {
    setIsAddingQuestion(true);
    // Reset the new question form without IDs
    setNewQuestion({
      content: "",
      answers: [
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
        { content: "", isCorrect: false },
      ],
    });
  }, []);

  // Cancel adding a new question
  const cancelAddingQuestion = useCallback(() => {
    setIsAddingQuestion(false);
  }, []);

  // Update the new question content
  const updateNewQuestionContent = useCallback((content: string) => {
    setNewQuestion((prev) => ({ ...prev, content }));
  }, []);

  // Update an answer's content in the new question using index instead of ID
  const updateNewAnswerContent = useCallback(
    (index: number, content: string) => {
      setNewQuestion((prev) => ({
        ...prev,
        answers: prev.answers.map((a, i) =>
          i === index ? { ...a, content } : a,
        ),
      }));
    },
    [],
  );

  // Update which answer is correct in the new question using index instead of ID
  const updateNewCorrectAnswer = useCallback((index: number) => {
    setNewQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((a, i) => ({
        ...a,
        isCorrect: i === index,
      })),
    }));
  }, []);

  // Save the new question
  const saveNewQuestion = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const response = await addQuestion({
        taskId: quizId, // Using quizId as taskId (may need adjustment based on your data model)
        questionContent: newQuestion.content,
        answers: newQuestion.answers.map((answer) => ({
          content: answer.content,
          isCorrect: answer.isCorrect,
        })),
      });

      if (response.success && response.data) {
        // Get the new question to the state
        const newQuestionWithId: Question = {
          id: response.data.id || (response.metadata.questionId as string),
          content: newQuestion.content,
          answers: newQuestion.answers as unknown as Question["answers"],
          quizGenerationTaskId: quizId,
        };

        setQuestions((prev) => [...prev, newQuestionWithId]);
        setIsAddingQuestion(false);
        toast.success("Question added successfully");
      } else {
        toast.error("Failed to add question", {
          description:
            (response.metadata.error as string) || "Unknown error occurred",
        });
      }
    } catch (error) {
      console.error("Error saving new question:", error);
      toast.error("Failed to add question", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newQuestion, quizId]);

  return {
    questions,
    setQuestions,
    editingQuestionId,
    editedQuestion,
    openAccordionItem,
    setOpenAccordionItem,
    isAddingQuestion,
    newQuestion,
    isSubmitting,
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
  };
}
