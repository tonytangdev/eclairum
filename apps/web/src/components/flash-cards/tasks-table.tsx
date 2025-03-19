import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { StatusBadge } from "./status-badge"
import { TaskSummaryResponse } from "@eclairum/backend/dtos"


interface TasksTableProps {
  tasks: TaskSummaryResponse[]
}

export function TasksTable({ tasks }: TasksTableProps) {
  // Format date to a readable format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Questions</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead className="hidden md:table-cell">Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title || "Untitled"}</TableCell>
              <TableCell className="hidden md:table-cell">
                <StatusBadge status={task.status} />
              </TableCell>
              <TableCell className="hidden md:table-cell">{task.questionsCount}</TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(task.createdAt)}</TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(task.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <TaskActions taskId={task.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface TaskActionsProps {
  taskId: string
}

function TaskActions({ taskId }: TaskActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="icon" title="Study" asChild>
        <Link href={`/flash-cards/${taskId}`}>
          <BookOpen className="h-4 w-4" />
          <span className="sr-only">Study</span>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/flash-cards/${taskId}`}>
              <Eye className="mr-2 h-4 w-4" />
              <span>View</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/flash-cards/${taskId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}