"use server";

import { Question } from "../types";
import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";
import { AxiosError } from "axios";

interface AddQuestionRequest {
  taskId: string;
  questionContent: string;
  answers: {
    content: string;
    isCorrect: boolean;
  }[];
}

interface ApiResponse<T> {
  data: T | null;
  metadata: Record<string, unknown>;
  success: boolean;
}

/**
 * Server action that adds a new question to a quiz
 */
export async function addQuestion(
  request: AddQuestionRequest,
): Promise<ApiResponse<Question>> {
  try {
    const { userId } = await auth();

    const { taskId, questionContent, answers } = request;

    // Input validation
    if (!userId || !taskId || !questionContent || !answers) {
      return {
        data: null,
        metadata: {
          error: "Missing required fields",
        },
        success: false,
      };
    }

    // Use serverApi instead of fetch
    const response = await serverApi.post("/questions", {
      userId,
      taskId,
      questionContent,
      answers,
    });

    // Axios directly returns the data from the response
    return response.data;
  } catch (error: unknown) {
    console.error("Error adding question:", error);

    // Enhanced error handling with proper type checking
    let errorMessage = "Unknown error occurred";

    if (error instanceof AxiosError) {
      // Handle Axios specific error
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      // Handle standard Error object
      errorMessage = error.message;
    }

    return {
      data: null,
      metadata: {
        error: errorMessage,
      },
      success: false,
    };
  }
}
