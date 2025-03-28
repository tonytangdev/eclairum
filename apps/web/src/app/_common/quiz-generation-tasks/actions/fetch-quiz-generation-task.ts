"use server";

import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";
import { TaskDetailResponse } from "@eclairum/backend/dtos";
import { mapTaskResponseToQuiz } from "../../../flash-cards/[id]/types";

export async function fetchQuizGenerationTask(taskId: string) {
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
    return {
      success: true,
      data: mapTaskResponseToQuiz(data, userId),
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
