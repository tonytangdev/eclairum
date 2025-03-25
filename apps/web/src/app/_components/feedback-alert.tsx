"use client";

import { useFlashCards } from "./flash-cards-context";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function FeedbackAlert() {
  const { feedback } = useFlashCards();

  if (!feedback) return null;

  return (
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
  );
}
