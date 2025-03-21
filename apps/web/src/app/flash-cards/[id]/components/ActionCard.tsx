import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayCircle, Trash2, Loader2 } from "lucide-react"

interface ActionCardProps {
  isDeleting: boolean;
  onDelete: () => void;
  onStartQuiz: () => void;
}

export function ActionCard({ isDeleting, onDelete, onStartQuiz }: ActionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 py-5 shadow-md hover:shadow-lg"
          onClick={onStartQuiz}
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          Start Quiz
        </Button>
        <Button
          variant="outline"
          className="w-full bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 transition-all duration-200 py-5"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-5 w-5" />
          )}
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardContent>
    </Card>
  )
}
