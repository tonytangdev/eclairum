import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteQuizGenerationTaskServer } from "../server-actions";

export function useQuizDeletion() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleDeleteQuiz = async (quizId: string) => {
    // Reset error state
    setError(null);

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
        const errorMessage = result.error || "Unknown error";
        setError(new Error(errorMessage));
        toast("Failed to delete quiz", {
          description: errorMessage,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Failed to delete quiz:", err);
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast("Error deleting quiz", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    error,
    handleDeleteQuiz,
  };
}
