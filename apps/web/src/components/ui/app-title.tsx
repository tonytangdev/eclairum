import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppTitleProps {
  className?: string
  iconSize?: number
  textSize?: string
}

export function AppTitle({ 
  className, 
  iconSize = 6, 
  textSize = "text-xl" 
}: AppTitleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BookOpen className={`h-${iconSize} w-${iconSize}`} />
      <span className={cn("font-bold", textSize)}>FlashMe</span>
    </div>
  )
}
