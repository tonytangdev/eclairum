"use client";

import { useFlashCards } from "./flash-cards-context";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/numbers";
import { MAX_TEXT_LENGTH } from "@eclairum/core/constants";

export function TextInput() {
  const { text, handleTextChange, characterCount, isOverLimit } = useFlashCards();

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Enter your text here..."
        className="min-h-[150px] h-[150px] max-h-[150px] resize-none overflow-y-auto"
        value={text}
        onChange={handleTextChange}
      />
      <div className={`text-xs flex justify-end ${isOverLimit ? "text-red-500" : "text-muted-foreground"}`}>
        {formatNumber(characterCount)}/{formatNumber(MAX_TEXT_LENGTH)} characters
      </div>
    </div>
  );
}
