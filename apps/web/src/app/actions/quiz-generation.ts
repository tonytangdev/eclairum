"use server";

import { serverApi } from "@/lib/api";
import { CreateQuizGenerationTaskDto } from "@flash-me/backend/dtos";

export async function createQuizGenerationTask(
  data: CreateQuizGenerationTaskDto,
) {
  try {
    const response = await serverApi.post("/quiz-generation-tasks", data);

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
