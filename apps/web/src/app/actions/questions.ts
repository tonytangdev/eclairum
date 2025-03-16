"use server";

import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";

type QuestionResponse = {
  data: {
    id: string;
    content: string;
    answers: {
      id: string;
      content: string;
      isCorrect: boolean;
    }[];
    metadata: {
      count: number;
      error?: string;
    };
    success: boolean;
  }[];
};

export async function getUserQuestions(limit?: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const response = await serverApi.get<QuestionResponse>(
      `/users/${userId}/questions`,
      {
        params: limit ? { limit } : undefined,
      },
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching user questions:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
