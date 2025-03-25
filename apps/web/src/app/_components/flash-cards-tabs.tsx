"use client";

import { useFlashCards } from "./flash-cards-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload } from "lucide-react";
import { TextInput } from "./text-input";
import { FileUpload } from "./file-upload";

export function FlashCardsTabs() {
  const { activeTab, handleTabChange } = useFlashCards();

  return (
    <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
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

      <TabsContent value="text">
        <TextInput />
      </TabsContent>

      <TabsContent value="upload">
        <FileUpload />
      </TabsContent>
    </Tabs>
  );
}
