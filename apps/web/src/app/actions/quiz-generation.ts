"use server";

import { serverApi } from "@/lib/api";
import {
  CreateQuizGenerationTaskDto,
  PaginatedTasksResponse,
  TaskSummaryResponse,
} from "@eclairum/backend/dtos";
import { auth } from "@clerk/nextjs/server";

export async function createQuizGenerationTask(
  data: Omit<CreateQuizGenerationTaskDto, "userId">,
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await serverApi.post("/quiz-generation-tasks", {
      ...data,
      userId,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Error in createQuizGenerationTask server action:",
      JSON.stringify(error),
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function fetchQuizGenerationTasks(
  page: number = 1,
  limit: number = 1,
): Promise<PaginatedTasksResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const { data } = await serverApi.get("quiz-generation-tasks", {
      params: { userId, page, limit },
    });

    // Convert string dates to Date objects
    return {
      ...data,
      data: data.data.map((task: TaskSummaryResponse) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      })),
    };
  } catch (error) {
    console.error(
      "Error fetching quiz generation tasks:",
      JSON.stringify(error),
    );
    throw new Error("Failed to fetch quiz generation tasks");
  }
}
