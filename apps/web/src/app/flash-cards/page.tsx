import { PageHeader } from "./_components/page-header"
import { TasksTable } from "./_components/tasks-table"
import { EmptyState } from "./_components/empty-state"
import { ServerPagination } from "../../components/pagination"
import { PaginatedTasksResponse } from "@eclairum/backend/dtos"
import { fetchQuizGenerationTasks } from "../_actions/fetch-quiz-generation-tasks"

export default async function MyFlashCards({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;

  // Fetch tasks from the server action
  const { data: tasks, meta: pagination } = await fetchQuizGenerationTasks(
    currentPage,
    pageSize
  ).catch(error => {
    console.error("Failed to fetch tasks:", error);
    const data: PaginatedTasksResponse = {
      data: [],
      meta: {
        page: 1,
        totalPages: 1,
        totalItems: 0,
        limit: pageSize,
      }
    }
    return data;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flash Cards"
        description="View and manage your created flash cards."
        action={{
          href: "/",
          label: "Create New"
        }}
      />
      {tasks.length > 0 ? (
        <>
          <TasksTable tasks={tasks} />

          <ServerPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            basePath="/flash-cards"
          />
        </>
      ) : (
        <EmptyState
          icon="bookOpen"
          title="No flash cards yet"
          description="You haven't created any flash cards yet. Get started by creating your first set."
          action={{
            href: "/flash-cards/create",
            label: "Create Flash Cards"
          }}
        />
      )}
    </div >
  )
}

