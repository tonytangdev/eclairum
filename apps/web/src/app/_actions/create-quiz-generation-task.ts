"use server";

import { serverApi } from "@/lib/api";
import { CreateQuizGenerationTaskDto } from "@eclairum/backend/dtos";
import { auth } from "@clerk/nextjs/server";
import { MAX_FILE_SIZE } from "@eclairum/core/constants";

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

export type FileUploadResponse = {
  success: boolean;
  fileUploadUrl?: string;
  taskId?: string;
  error?: string;
};

/**
 * Creates a quiz generation task with file upload support
 * @param text Initial text description (can be empty for file uploads)
 * @param fileSize Size of the file in bytes, if known client-side
 */
export async function createFileUploadTask(
  text: string = "",
  fileSize?: number,
): Promise<FileUploadResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Check file size if provided
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds the maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
      };
    }

    // Specify that this is a file upload task
    const response = await serverApi.post("/quiz-generation-tasks", {
      text,
      userId,
      isFileUpload: true,
    });

    return {
      success: true,
      fileUploadUrl: response.data.fileUploadUrl,
      taskId: response.data.taskId,
    };
  } catch (error) {
    console.error(
      "Error in createFileUploadTask server action:",
      JSON.stringify(error),
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export type ResumeTaskResponse = {
  success: boolean;
  taskId?: string;
  error?: string;
};

/**
 * Resumes a quiz generation task after the file has been uploaded
 * @param taskId The ID of the task to resume
 * @returns Response indicating success or failure
 */
export async function resumeQuizGenerationTask(
  taskId: string,
): Promise<ResumeTaskResponse> {
  try {
    const { userId } = await auth();
    console.log("Resuming task with ID:", taskId);
    console.log("User ID:", userId);

    if (!userId) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Call the backend API to resume the task
    // Instead of sending null as body and userId as query parameter,
    // we're sending an empty object as the body and using query parameters
    await serverApi.post(
      `/quiz-generation-tasks/${taskId}/resume`,
      {},
      {
        params: { userId },
      },
    );

    return {
      success: true,
      taskId,
    };
  } catch (error) {
    console.error(
      "Error in resumeQuizGenerationTask server action:",
      JSON.stringify(error),
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
