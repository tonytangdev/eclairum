import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteQuizGenerationTaskServer } from "../server-actions";

export function useQuizDeletion() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteQuizGenerationTaskServer(quizId);

      if (result.success) {
        toast("Quiz deleted successfully");
        router.push("/flash-cards");
      } else {
        toast("Failed to delete quiz: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast("Error deleting quiz");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteQuiz,
  };
}
