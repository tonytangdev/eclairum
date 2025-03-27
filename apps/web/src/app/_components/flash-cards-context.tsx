"use client";

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { MAX_TEXT_LENGTH, MAX_FILE_SIZE } from "@eclairum/core/constants";
import {
  createQuizGenerationTask,
  createFileUploadTask,
  resumeQuizGenerationTask
} from "@/app/_actions/create-quiz-generation-task";

type UploadStatus = "idle" | "preparing" | "uploading" | "complete" | "processing" | "error";
type FeedbackType = { type: "success" | "error"; message: string } | null;
type TabType = "text" | "upload";

interface FlashCardsContextValue {
  // State
  text: string;
  isLoading: boolean;
  feedback: FeedbackType;
  activeTab: TabType;
  file: File | null;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;

  // Computed values
  characterCount: number;
  isOverLimit: boolean;
  isFileTooLarge: boolean;
  fileUploadReady: boolean;

  // Methods
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileSelection: (selectedFile: File) => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
  removeFile: () => void;
  handleFileUpload: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  handleTabChange: (value: string) => void;
}

const FlashCardsContext = createContext<FlashCardsContextValue | undefined>(undefined);

export function FlashCardsProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const { isSignedIn } = useUser();
  const clerk = useClerk();

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_TEXT_LENGTH;
  const isFileTooLarge = Boolean(file && file.size > MAX_FILE_SIZE);
  const fileUploadReady = Boolean(file && !isFileTooLarge);

  /**
   * Resumes the quiz generation task after the file has been uploaded successfully
   * @param id - The ID of the task to resume (explicitly passed to avoid state closure issues)
   */
  const handleResumeTask = useCallback(async (id: string) => {
    if (!id) return;

    try {
      setUploadStatus("processing");
      setFeedback({
        type: "success",
        message: "Processing your file. This may take a moment..."
      });

      const result = await resumeQuizGenerationTask(id);

      if (!result.success) {
        throw new Error(result.error || "Failed to process file");
      }

      setFeedback({
        type: "success",
        message: "Your file has been processed. You'll be able to review your flash cards soon!"
      });
    } catch (error) {
      console.error("Error resuming task:", error);
      setFeedback({
        type: "error",
        message: "Error processing your file. Please try again."
      });
      setUploadStatus("error");
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (feedback) {
      setFeedback(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setFeedback(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  }, []);

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFeedback({
        type: "error",
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      });
      setFile(null);
      return;
    }

    const supportedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!supportedTypes.includes(selectedFile.type)) {
      setFeedback({
        type: "error",
        message: "Unsupported file type. Please upload PDF, JPEG or PNG files."
      });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFeedback(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async () => {
    if (!file || isFileTooLarge) return;
    if (!isSignedIn) {
      return clerk.openSignIn();
    }

    setIsLoading(true);
    setUploadStatus("preparing");
    setUploadProgress(0);
    setFeedback(null);

    try {
      const result = await createFileUploadTask('', file.size, file.name);

      if (!result.success || !result.fileUploadUrl || !result.taskId) {
        throw new Error(result.error || "Failed to create upload task");
      }

      // Store the taskId for later tracking
      const uploadTaskId = result.taskId;
      setUploadStatus("uploading");

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", result.fileUploadUrl);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onreadystatechange = async () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadStatus("complete");
            setFeedback({
              type: "success",
              message: "File uploaded successfully! Starting processing..."
            });


            await handleResumeTask(uploadTaskId);
          } else {
            setUploadStatus("error");
            setFeedback({
              type: "error",
              message: "Error uploading your file. Please try again."
            });
          }
        }
      };

      xhr.onerror = () => {
        setUploadStatus("error");
        setFeedback({
          type: "error",
          message: "Network error while uploading your file. Please try again."
        });
      };

      xhr.send(file);
    } catch (error) {
      setUploadStatus("error");
      setFeedback({
        type: "error",
        message: "Failed to upload file. Please try again."
      });
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === "text") {
      if (isOverLimit || characterCount < 10) {
        setFeedback({
          type: "error",
          message: characterCount < 10
            ? "Text must be at least 10 characters"
            : "Text exceeds the maximum character limit"
        });
        return;
      }

      setIsLoading(true);
      setFeedback(null);

      try {
        if (!isSignedIn) {
          return clerk.openSignIn();
        }

        const result = await createQuizGenerationTask({
          text,
        });

        if (result.success) {
          setFeedback({
            type: "success",
            message: "Your request is being processed. Feel free to create more flash cards while waiting!"
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        setFeedback({
          type: "error",
          message: "Failed to generate flash cards. Please try again."
        });
        console.error("Error creating quiz generation task:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (activeTab === "upload") {
      await handleFileUpload();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
    setFeedback(null);
  };

  const value: FlashCardsContextValue = {
    text,
    isLoading,
    feedback,
    activeTab,
    file,
    uploadStatus,
    uploadProgress,
    isDragging,
    fileInputRef,

    characterCount,
    isOverLimit,
    isFileTooLarge,
    fileUploadReady,

    handleTextChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelection,
    handleFileInputChange,
    openFileDialog,
    removeFile,
    handleFileUpload,
    handleSubmit,
    handleTabChange,
  };

  return (
    <FlashCardsContext.Provider value={value}>
      {children}
    </FlashCardsContext.Provider>
  );
}

export function useFlashCards() {
  const context = useContext(FlashCardsContext);
  if (context === undefined) {
    throw new Error("useFlashCards must be used within a FlashCardsProvider");
  }
  return context;
}
