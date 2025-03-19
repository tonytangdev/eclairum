import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { BookOpen, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { fetchQuizGenerationTasks } from "@/app/actions/quiz-generation"
import { PaginationBar } from "@/components/pagination-bar"


export default async function MyFlashCards({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const page = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 1;

  // Fetch tasks from the server action
  const { data: tasks, meta: pagination } = await fetchQuizGenerationTasks(
    currentPage,
    pageSize
  ).catch(error => {
    console.error("Failed to fetch tasks:", error);
    return { data: [], meta: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: pageSize } };
  });

  // Format date to a readable format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Flash Cards</h1>
          <p className="text-muted-foreground">View and manage your created flash cards.</p>
        </div>
        <Button asChild>
          <Link href="/flash-cards/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {tasks.length > 0 ? (
        <>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Study">
                          <BookOpen className="h-4 w-4" />
                          <span className="sr-only">Study</span>
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
                              <Link href={`/flash-cards/${task.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/flash-cards/${task.id}/edit`}>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <PaginationBar
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No flash cards yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven&apos;t created any flash cards yet. Get started by creating your first set.
          </p>
          <Button asChild className="mt-4">
            <Link href="/flash-cards/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Flash Cards
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// Display a colored badge based on the task status
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string, className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
    COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
    FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
    IN_PROGRESS: { label: "Processing", className: "bg-blue-100 text-blue-800" }
  };

  const { label, className } = statusMap[status] || {
    label: status,
    className: "bg-gray-100 text-gray-800"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

