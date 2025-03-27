"use client";

import { useFlashCards } from "./flash-cards-context";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { MAX_FILE_SIZE } from "@eclairum/core/constants";

export function FileUpload() {
  const {
    file,
    fileInputRef,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFileDialog,
    isDragging,
    isFileTooLarge,
    removeFile,
    isLoading,
    uploadStatus,
    uploadProgress
  } = useFlashCards();

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
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
          <p className="text-xs text-muted-foreground">PDF (max {MAX_FILE_SIZE / (1024 * 1024)}MB)</p>
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
    </div>
  );
}
