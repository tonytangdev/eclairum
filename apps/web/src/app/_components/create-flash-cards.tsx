"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, CheckCircle, AlertCircle, ArrowRight, File, X } from "lucide-react";
import { MAX_TEXT_LENGTH, MAX_FILE_SIZE } from "@eclairum/core/constants";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { createQuizGenerationTask, createFileUploadTask } from "@/app/_actions/create-quiz-generation-task";
import { Progress } from "@/components/ui/progress";

type UploadStatus = "idle" | "preparing" | "uploading" | "complete" | "error";

export function CreateFlashCards() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "upload">("text");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isSignedIn } = useUser();
  const clerk = useClerk();

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_TEXT_LENGTH;
  const isFileTooLarge = file && file.size > MAX_FILE_SIZE;
  const fileUploadReady = file && !isFileTooLarge;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Clear any previous feedback when user starts typing again
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
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFeedback({
        type: "error",
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      });
      setFile(null);
      return;
    }

    // Check file type (optional - consider what file types you want to support)
    const supportedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!supportedTypes.includes(selectedFile.type)) {
      setFeedback({
        type: "error",
        message: "Unsupported file type. Please upload PDF, TXT, or DOCX files."
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
      // Create the upload task and get the upload URL
      const result = await createFileUploadTask("", file.size);

      if (!result.success || !result.fileUploadUrl || !result.taskId) {
        throw new Error(result.error || "Failed to create upload task");
      }

      // Prepare the file upload
      setUploadStatus("uploading");

      // Upload the file directly to the provided URL
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
              message: "Your file has been uploaded and is being processed. You'll be able to review your flash cards soon!"
            });
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
    setActiveTab(value as "text" | "upload");
    setFeedback(null);
  };

  return (
    <section id="create-now" className="space-y-8">
      <Card className="max-w-3xl mx-auto border-primary shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Create Flash Cards</CardTitle>
          <CardDescription>Upload text, images, or files to create flash cards instantly</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-2 mb-6 w-full">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2 relative group">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter your text here..."
                    className="min-h-[150px] h-[150px] max-h-[150px] resize-none overflow-y-auto"
                    value={text}
                    onChange={handleTextChange}
                  />
                  <div className={`text-xs flex justify-end ${isOverLimit ? "text-red-500" : "text-muted-foreground"}`}>
                    {characterCount}/{MAX_TEXT_LENGTH} characters
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".pdf,.txt,.docx"
                />

                {!file ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 transition-colors min-h-[150px] flex flex-col items-center justify-center text-center cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-1">Drag and drop a file here or click to browse</p>
                    <p className="text-xs text-muted-foreground">PDF, TXT, DOCX (max {MAX_FILE_SIZE / (1024 * 1024)}MB)</p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <File className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase() || file.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove file</span>
                      </Button>
                    </div>

                    {uploadStatus === "uploading" && (
                      <div className="space-y-1">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-center text-muted-foreground">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                      )}

                      {isFileTooLarge && (
                        <div className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          File exceeds the maximum size of {MAX_FILE_SIZE / (1024 * 1024)}MB
                        </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {feedback && (
              <div className={`p-3 rounded-md flex items-start gap-2 ${feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                {feedback.type === "success" ? (
                  <>
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <p className="flex-grow">{feedback.message}</p>
                    <Link href="/flash-cards-session">
                      <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer">
                        Start Flashing session <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{feedback.message}</p>
                  </>
                )}
              </div>
            )}

            <CardFooter className="border-t px-6 py-4 -mx-6 mt-6 rounded-b-lg">
              <Button
                size="lg"
                className="w-full py-6 text-lg"
                disabled={
                  isLoading ||
                  (activeTab === "text" && (isOverLimit || characterCount < 10)) ||
                  (activeTab === "upload" && !fileUploadReady)
                }
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-t-transparent animate-spin rounded-full"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Flash me!
                  </>
                )}
              </Button>
            </CardFooter>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
