import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { BookOpen, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

// Sample data for the table
const flashCardSets = [
  {
    id: 1,
    title: "Biology Terms",
    cards: 12,
    created: "2023-05-15T10:30:00",
    lastModified: "2023-06-02T14:45:00",
  },
  {
    id: 2,
    title: "Spanish Vocabulary",
    cards: 24,
    created: "2023-04-20T09:15:00",
    lastModified: "2023-06-10T11:20:00",
  },
  {
    id: 3,
    title: "Math Formulas",
    cards: 8,
    created: "2023-06-05T16:00:00",
    lastModified: "2023-06-05T16:00:00",
  },
  {
    id: 4,
    title: "Historical Dates",
    cards: 15,
    created: "2023-03-12T13:45:00",
    lastModified: "2023-05-28T10:10:00",
  },
  {
    id: 5,
    title: "Programming Concepts",
    cards: 18,
    created: "2023-05-30T08:30:00",
    lastModified: "2023-06-12T09:25:00",
  },
]

export default function MyFlashCards() {
  // Format date to a readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Flash Cards</h1>
          <p className="text-muted-foreground">View and manage your created flash cards.</p>
        </div>
        <Button asChild>
          <Link href="/">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {flashCardSets.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Cards</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flashCardSets.map((set) => (
                <TableRow key={set.id}>
                  <TableCell className="font-medium">{set.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{set.cards}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(set.created)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(set.lastModified)}</TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit</span>
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
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No flash cards yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven't created any flash cards yet. Get started by creating your first set.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">
              <Plus className="mr-2 h-4 w-4" />
              Create Flash Cards
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

