import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/api";
import { TaskDetailResponse } from "@eclairum/backend/dtos";
import { QuizGenerationStatus } from "@eclairum/core/entities";
import { Quiz } from "./types";

export async function fetchQuizGenerationTaskServer(taskId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const { data } = await serverApi.get<TaskDetailResponse>(
      `/quiz-generation-tasks/${taskId}`,
      {
        params: { userId },
      },
    );

    // Format the data to match the interface expected by the page component
    return {
      success: true,
      data: {
        id: data.id,
        textContent: data.title || "", // Note: Assuming the API doesn't directly provide textContent
        questions: data.questions.map((question) => ({
          id: question.id,
          content: question.text,
          answers: question.answers.map((answer) => ({
            id: answer.id,
            content: answer.text,
            isCorrect: answer.isCorrect,
            questionId: question.id,
          })),
          quizGenerationTaskId: data.id,
        })),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        deletedAt: null, // Assuming the API doesn't return deletedAt for active tasks
        status: data.status as QuizGenerationStatus,
        generatedAt: data.generatedAt ? new Date(data.generatedAt) : new Date(),
        userId,
        title: data.title,
        category: "", // Add category if the API provides it
      } as Quiz,
    };
  } catch (error) {
    console.error(
      `Error fetching quiz generation task ${taskId}:`,
      JSON.stringify(error),
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch quiz",
    };
  }
}
