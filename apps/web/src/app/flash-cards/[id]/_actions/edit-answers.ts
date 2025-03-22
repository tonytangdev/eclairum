"use server";

import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";
import { AxiosError } from "axios";
import { Answer } from "../types";
import { EditAnswerDto } from "@eclairum/backend/dtos";

interface ApiResponse<T> {
  data: T | null;
  metadata: Record<string, unknown>;
  success: boolean;
}

interface EditAnswerRequest extends EditAnswerDto {
  id: string;
}

/**
 * Server action that edits existing answers
 */
export async function editAnswers(
  answers: EditAnswerRequest[],
): Promise<ApiResponse<Answer[]>> {
  try {
    const { userId } = await auth();

    // Input validation
    if (!userId || answers.length === 0) {
      return {
        data: null,
        metadata: {
          error: "Missing required fields",
        },
        success: false,
      };
    }

    const updatedAnswers: Answer[] = [];
    for (const answer of answers) {
      const { id, answerContent, isCorrect } = answer;

      // Input validation
      if (!id || !answerContent) {
        throw new Error("Missing required fields");
      }

      // Use serverApi instead of fetch
      const response = await serverApi.put(`/answers/${id}`, {
        userId,
        answerContent,
        isCorrect,
      });

      updatedAnswers.push(response.data);
    }

    return {
      data: updatedAnswers,
      metadata: {},
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error editing answers:", error);

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
