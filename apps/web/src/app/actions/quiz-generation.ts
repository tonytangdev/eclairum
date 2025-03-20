"use server";

import { serverApi } from "@/lib/api";
import {
  CreateQuizGenerationTaskDto,
  PaginatedTasksResponse,
  TaskSummaryResponse,
  TaskDetailResponse,
} from "@eclairum/backend/dtos";
import { auth } from "@clerk/nextjs/server";
import { QuizGenerationStatus } from "@eclairum/core/entities";

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
      },
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
