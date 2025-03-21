import { useState } from "react";
import { Question } from "../types";

interface NewQuestion {
  content: string;
  answers: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
  }>;
}

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
  const [newQuestion, setNewQuestion] = useState<NewQuestion>(
    createEmptyQuestion(),
  );

  function createEmptyQuestion(): NewQuestion {
    return {
      content: "",
      answers: [
        { id: `new-a1-${Date.now()}`, content: "", isCorrect: true },
        { id: `new-a2-${Date.now()}`, content: "", isCorrect: false },
        { id: `new-a3-${Date.now()}`, content: "", isCorrect: false },
        { id: `new-a4-${Date.now()}`, content: "", isCorrect: false },
      ],
    };
  }

  // Question editing functions
  const startEditingQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditedQuestion({ ...question, answers: [...question.answers] });
    setOpenAccordionItem(question.id);
  };

  const cancelEditingQuestion = () => {
    setEditingQuestionId(null);
    setEditedQuestion(null);
  };

  const updateEditedQuestionContent = (content: string) => {
    setEditedQuestion((prev) => (prev ? { ...prev, content } : null));
  };

  const updateEditedAnswerContent = (answerId: string, content: string) => {
    setEditedQuestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: prev.answers.map((a) =>
          a.id === answerId ? { ...a, content } : a,
        ),
      };
    });
  };

  const updateEditedCorrectAnswer = (answerId: string) => {
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
  };

  const saveEditedQuestion = () => {
    if (!editedQuestion) return;

    setQuestions((prev) =>
      prev.map((q) => (q.id === editingQuestionId ? editedQuestion : q)),
    );

    setEditingQuestionId(null);
    setEditedQuestion(null);
  };

  // New question functions
  const startAddingQuestion = () => {
    setIsAddingQuestion(true);
    setNewQuestion(createEmptyQuestion());
  };

  const cancelAddingQuestion = () => {
    setIsAddingQuestion(false);
  };

  const updateNewQuestionContent = (content: string) => {
    setNewQuestion((prev) => ({ ...prev, content }));
  };

  const updateNewAnswerContent = (answerId: string, content: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((a) =>
        a.id === answerId ? { ...a, content } : a,
      ),
    }));
  };

  const updateNewCorrectAnswer = (answerId: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      answers: prev.answers.map((a) => ({
        ...a,
        isCorrect: a.id === answerId,
      })),
    }));
  };

  const saveNewQuestion = () => {
    const newQuestionId = `q${Date.now()}`;
    const newQuestionObj = {
      id: newQuestionId,
      content: newQuestion.content,
      answers: newQuestion.answers.map((a) => ({
        ...a,
        questionId: newQuestionId,
      })),
      quizGenerationTaskId: quizId,
    };

    setQuestions((prev) => [...prev, newQuestionObj]);
    setIsAddingQuestion(false);
  };

  return {
    questions,
    setQuestions,
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
  };
}
