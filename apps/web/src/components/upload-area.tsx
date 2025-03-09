"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, ImageIcon, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type UploadType = "text" | "image" | "file"
type UploadItem = {
  type: UploadType
  content: string
  file?: File
  preview?: string
}

export function UploadArea() {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [text, setText] = useState("")
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


  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          placeholder="Enter your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px]"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleTextSubmit}>Add Text</Button>
          <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <File className="mr-2 h-4 w-4" />
            Upload File
          </Button>
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "file")}
          />
        </div>
      </div>

      <Button size="lg" className="w-full py-6 text-lg" disabled={uploads.length === 0}>
        <Upload className="mr-2 h-5 w-5" />
        Flash me!
      </Button>
    </div>
  )
}

