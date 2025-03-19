import { fetchQuizGenerationTasks } from "@/app/actions/quiz-generation"
import { PageHeader } from "../../components/flash-cards/page-header"
import { TasksTable } from "../../components/flash-cards/tasks-table"
import { EmptyState } from "../../components/flash-cards/empty-state"
import { PaginationSection } from "../../components/flash-cards/pagination-section"

export default async function MyFlashCards({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = 10;

  // Fetch tasks from the server action
  const { data: tasks, meta: pagination } = await fetchQuizGenerationTasks(
    currentPage,
    pageSize
  ).catch(error => {
    console.error("Failed to fetch tasks:", error);
    return { data: [], meta: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: pageSize } };
  });

  console.log('meta:', pagination);


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
          
          <PaginationSection 
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
    </div>
  )
}

