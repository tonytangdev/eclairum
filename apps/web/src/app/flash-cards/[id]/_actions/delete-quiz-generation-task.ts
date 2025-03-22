"use server";

import { auth } from "@clerk/nextjs/server";
import { serverApi } from "@/lib/api";

export async function deleteQuizGenerationTask(taskId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    await serverApi.delete(`/quiz-generation-tasks/${taskId}`, {
      params: { userId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      `Error deleting quiz generation task ${taskId}:`,
      JSON.stringify(error),
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete quiz",
    };
  }
}
