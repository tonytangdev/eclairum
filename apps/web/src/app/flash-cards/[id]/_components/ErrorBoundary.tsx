"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
  componentName?: string
}

export function ErrorBoundary({
  children,
  fallback,
  onReset,
  componentName = "component"
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Add event listener for unhandled errors
    const errorHandler = (event: ErrorEvent) => {
      event.preventDefault()
      setHasError(true)
      setError(event.error || new Error("An unknown error occurred"))
    }

    window.addEventListener("error", errorHandler)
    return () => window.removeEventListener("error", errorHandler)
  }, [])

  // Reset the error state
  const handleReset = () => {
    setHasError(false)
    setError(null)
    onReset?.()
  }

  // Log the error for debugging
  useEffect(() => {
    if (error) {
      console.error(`Error in ${componentName}:`, error)
    }
  }, [error, componentName])

  if (hasError) {
    if (fallback) return <>{fallback}</>

    return (
      <Card className="bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400 mb-4">
            An error occurred while rendering the {componentName}.
          </p>
          {error && (
            <pre className="bg-red-100 dark:bg-red-900/20 p-4 rounded-md text-sm overflow-auto max-h-32 mb-4">
              {error.message}
            </pre>
          )}
          <Button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
