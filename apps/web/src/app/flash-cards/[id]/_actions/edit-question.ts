"use server";

import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";
import { AxiosError } from "axios";
import { Question } from "../types";
import { EditQuestionDto } from "@eclairum/backend/dtos";

interface ApiResponse<T> {
  data: T | null;
  metadata: Record<string, unknown>;
  success: boolean;
}

/**
 * Server action that edits an existing question
 */
export async function editQuestion(
  request: EditQuestionDto,
): Promise<ApiResponse<Question>> {
  try {
    const { userId } = await auth();

    const { questionId, questionContent } = request;

    // Input validation
    if (!userId || !questionId || !questionContent) {
      return {
        data: null,
        metadata: {
          error: "Missing required fields",
        },
        success: false,
      };
    }

    // Use serverApi instead of fetch
    const response = await serverApi.put("/questions", {
      userId,
      questionId,
      questionContent,
    });

    // Axios directly returns the data from the response
    return response.data;
  } catch (error: unknown) {
    console.error("Error editing question:", error);

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
