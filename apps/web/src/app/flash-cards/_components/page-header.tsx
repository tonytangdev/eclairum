import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

interface PageHeaderProps {
  title: string
  description: string
  action?: {
    href: string
    label: string
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button asChild>
          <Link href={action.href}>
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  )
}
