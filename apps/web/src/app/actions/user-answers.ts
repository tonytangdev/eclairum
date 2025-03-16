"use server";

import { serverApi } from "@/lib/api";
import { auth } from "@clerk/nextjs/server";

interface SubmitAnswerData {
  questionId: string;
  answerId: string;
}

export async function submitAnswer(data: SubmitAnswerData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    await serverApi.post("/user-answers", {
      userId,
      questionId: data.questionId,
      answerId: data.answerId,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error submitting answer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
