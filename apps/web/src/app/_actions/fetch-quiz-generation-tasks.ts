"use server";

import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";
import {
  PaginatedTasksResponse,
  TaskSummaryResponse,
} from "@eclairum/backend/dtos";

export async function fetchQuizGenerationTasks(
  page: number = 1,
  limit: number = 1,
): Promise<PaginatedTasksResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const { data } = await serverApi.get<PaginatedTasksResponse>(
      "quiz-generation-tasks",
      {
        params: { userId, page, limit },
      },
    );

    const tasks = data.data.map((task: TaskSummaryResponse) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    }));

    // Convert string dates to Date objects
    return {
      meta: data.meta,
      data: tasks,
    };
  } catch (error) {
    console.error(
      "Error fetching quiz generation tasks:",
      JSON.stringify(error),
    );
    throw new Error("Failed to fetch quiz generation tasks");
  }
}
