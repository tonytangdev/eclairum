"use server";

import { serverApi } from "@/lib/api";
import { CreateQuizGenerationTaskDto } from "@flash-me/backend/dtos";
import { auth } from "@clerk/nextjs/server";

export async function createQuizGenerationTask(
  data: Omit<CreateQuizGenerationTaskDto, "userId">,
) {
  try {
    const { userId } = await auth();
    const response = await serverApi.post("/quiz-generation-tasks", {
      ...data,
      userId,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error in createQuizGenerationTask server action:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
