"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, ImageIcon, File, CheckCircle, AlertCircle } from "lucide-react";
import { createQuizGenerationTask } from "@/app/actions/quiz-generation";
import { MAX_TEXT_LENGTH } from "@flash-me/core/constants";


export function CreateFlashCards() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_TEXT_LENGTH;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Clear any previous feedback when user starts typing again
    if (feedback) {
      setFeedback(null);
    }
  };

  const handleSubmit = async () => {
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
      const result = await createQuizGenerationTask({
        text,
        userId: 'zefz'
      });

      if (result.success) {
        setFeedback({
          type: "success",
          message: "Flash cards generation started! This might take a moment."
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
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 w-full">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2 relative group">
                  <Upload className="h-4 w-4" />
                  Upload
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Coming soon!
                  </div>
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
                <div className="border-2 border-dashed rounded-lg p-8 transition-colors min-h-[150px] flex flex-col items-center justify-center text-center border-muted-foreground/20 relative">
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                    <p className="text-muted-foreground mb-2">File upload feature coming soon!</p>
                    <p className="text-sm text-muted-foreground">
                      This feature is not available in the current version.
                    </p>
                  </div>
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">Drag and drop files here</p>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                    <Button variant="outline" disabled>
                      <File className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {feedback && (
              <div className={`p-3 rounded-md flex items-start gap-2 ${feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                {feedback.type === "success" ? (
                  <CheckCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <p>{feedback.message}</p>
              </div>
            )}

            <CardFooter className="border-t px-6 py-4 -mx-6 mt-6 rounded-b-lg">
              <Button
                size="lg"
                className="w-full py-6 text-lg"
                disabled={isLoading || isOverLimit || characterCount < 10}
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
