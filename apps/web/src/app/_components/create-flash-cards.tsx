"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { FlashCardsProvider, useFlashCards } from "./flash-cards-context";
import { FlashCardsTabs } from "./flash-cards-tabs";
import { FeedbackAlert } from "./feedback-alert";

function FlashCardsForm() {
  const {
    handleSubmit,
    isLoading,
    activeTab,
    isOverLimit,
    characterCount,
    fileUploadReady
  } = useFlashCards();

  const isSubmitDisabled =
    isLoading ||
    (activeTab === "text" && (isOverLimit || characterCount < 10)) ||
    (activeTab === "upload" && !fileUploadReady);

  return (
    <Card className="max-w-3xl mx-auto border-primary shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl">Create Flash Cards</CardTitle>
        <CardDescription>Upload text, images, or files to create flash cards instantly</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <FlashCardsTabs />
          <FeedbackAlert />

          <CardFooter className="border-t px-6 py-4 -mx-6 mt-6 rounded-b-lg">
            <Button
              size="lg"
              className="w-full py-6 text-lg"
              disabled={isSubmitDisabled}
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
  );
}

export function CreateFlashCards() {
  return (
    <FlashCardsProvider>
      <section id="create-now" className="space-y-8">
        <FlashCardsForm />
      </section>
    </FlashCardsProvider>
  );
}
