import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: "bookOpen" | string // Add more icon types as needed
  title: string
  description: string
  action?: {
    href: string
    label: string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = getIconComponent(icon);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button asChild className="mt-4">
          <Link href={action.href}>
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

function getIconComponent(iconName: string): LucideIcon {
  switch (iconName) {
    case "bookOpen":
      return BookOpen;
    default:
      return BookOpen;
  }
}