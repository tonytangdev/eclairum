"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, ImageIcon, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { cn } from "@/lib/utils"

type UploadType = "text" | "image" | "file"
type UploadItem = {
  type: UploadType
  content: string
  file?: File
  preview?: string
}

export function CreateFlashCards() {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [text, setText] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleTextSubmit = () => {
    if (text.trim()) {
      setUploads([...uploads, { type: "text", content: text }])
      setText("")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const item: UploadItem = {
        type,
        content: file.name,
        file,
      }

      if (type === "image") {
        item.preview = URL.createObjectURL(file)
      }

      setUploads([...uploads, item])
      e.target.value = ""
    }
  }

  const removeUpload = (index: number) => {
    const newUploads = [...uploads]
    if (newUploads[index].preview) {
      URL.revokeObjectURL(newUploads[index].preview!)
    }
    newUploads.splice(index, 1)
    setUploads(newUploads)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const type = file.type.startsWith("image/") ? "image" : "file"

      const item: UploadItem = {
        type,
        content: file.name,
        file,
      }

      if (type === "image") {
        item.preview = URL.createObjectURL(file)
      }

      setUploads([...uploads, item])
    }
  }

  const isPremiumRequired = uploads.length >= 5

  return (
    <div className="space-y-6">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
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
          <Textarea
            placeholder="Enter your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={handleTextSubmit} disabled={!text.trim() || uploads.length >= 1} className="w-full">
            {uploads.length >= 1 ? "Only one upload allowed" : "Add Text"}
          </Button>
          {uploads.length >= 1 && (
            <p className="text-amber-500 text-sm text-center">
              You can only upload one text/file at a time in the free version.
            </p>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 transition-colors min-h-[150px] flex flex-col items-center justify-center text-center border-muted-foreground/20 relative">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
              <p className="text-muted-foreground mb-2">File upload feature coming soon!</p>
              <p className="text-sm text-muted-foreground">This feature is not available in the current version.</p>
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

      {uploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your uploads ({uploads.length}/5 free)</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploads.map((item, index) => (
              <div key={index} className="relative group border rounded-md overflow-hidden">
                {item.type === "image" && item.preview ? (
                  <div className="aspect-video relative">
                    <Image src={item.preview || "/placeholder.svg"} alt={item.content} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {item.type === "text" ? (
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <File className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeUpload(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
                <div className="p-3">
                  <p className="truncate text-sm">
                    {item.type === "text"
                      ? item.content.substring(0, 50) + (item.content.length > 50 ? "..." : "")
                      : item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn("text-center", isPremiumRequired && "bg-muted p-4 rounded-lg")}>
        {isPremiumRequired ? (
          <div className="space-y-2">
            <p className="font-medium">You've reached the free limit of 5 uploads.</p>
            <p className="text-muted-foreground">Upgrade to premium for unlimited uploads.</p>
            <Button variant="default">Upgrade to Premium</Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {uploads.length > 0
              ? `You have ${5 - uploads.length} free uploads remaining.`
              : "You can upload up to 5 texts/files for free."}
          </p>
        )}
      </div>

      <CardFooter className="bg-primary/5 border-t px-6 py-4 -mx-6 mt-6 rounded-b-lg">
        <Button size="lg" className="w-full py-6 text-lg" disabled={uploads.length === 0}>
          <Upload className="mr-2 h-5 w-5" />
          Flash me!
        </Button>
      </CardFooter>
    </div>
  )
}

