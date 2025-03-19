import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationSectionProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function PaginationSection({
  currentPage,
  totalPages,
  basePath
}: PaginationSectionProps) {

  console.log('PaginationSectionProps:', { currentPage, totalPages, basePath });

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PreviousButton currentPage={currentPage} basePath={basePath} />
        {totalPages < 5 ? (
          <Under6PagesButtons currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
        ) : (
          <Over5PagesButtons currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
        )}
        <NextButton currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
      </PaginationContent>
    </Pagination>
  );
}

function PreviousButton({ currentPage, basePath }: { currentPage: number; basePath: string }) {
  return (
    <PaginationItem key="prev">
      {currentPage > 1 ? (
        <PaginationPrevious href={`${basePath}?page=${currentPage - 1}`} />
      ) : (
        <PaginationPrevious href="#" aria-disabled="true" className="pointer-events-none opacity-50" />
      )}
    </PaginationItem>
  );
}

function NextButton({ currentPage, totalPages, basePath }: { currentPage: number; totalPages: number; basePath: string }) {
  return (
    <PaginationItem key="next">
      {currentPage < totalPages ? (
        <PaginationNext href={`${basePath}?page=${currentPage + 1}`} />
      ) : (
        <PaginationNext href="#" aria-disabled="true" className="pointer-events-none opacity-50" />
      )}
    </PaginationItem>
  );
}

function PageButton({ page, currentPage, basePath }: { page: number; currentPage: number; basePath: string }) {
  return (
    <PaginationItem key={page}>
      <PaginationLink
        href={`${basePath}?page=${page}`}
        isActive={currentPage === page}
      >
        {page}
      </PaginationLink>
    </PaginationItem>
  );
}

function Under6PagesButtons({ currentPage, totalPages, basePath }: { currentPage: number; totalPages: number; basePath: string }) {
  return (
    <>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <PageButton key={page} page={page} currentPage={currentPage} basePath={basePath} />
      ))}
    </>
  );
}

function Over5PagesButtons({ currentPage, totalPages, basePath }: { currentPage: number; totalPages: number; basePath: string }) {
  // Always show first page
  const pages = [1];

  // Determine visible page range
  let rangeStart = Math.max(2, currentPage - 1);
  let rangeEnd = Math.min(totalPages - 1, currentPage + 1);

  // Adjust range for edge cases
  if (currentPage <= 3) {
    // Near the beginning, show more pages at start
    rangeStart = 2;
    rangeEnd = Math.min(5, totalPages - 1);
  } else if (currentPage >= totalPages - 2) {
    // Near the end, show more pages at end
    rangeStart = Math.max(2, totalPages - 4);
    rangeEnd = totalPages - 1;
  }

  // Add left ellipsis if needed
  if (rangeStart > 2) {
    pages.push(-1); // Use -1 to represent ellipsis
  }

  // Add middle pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add right ellipsis if needed
  if (rangeEnd < totalPages - 1) {
    pages.push(-2); // Use -2 to represent ellipsis
  }

  // Always add last page if there's more than one page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <>
      {pages.map(page =>
        page < 0 ? (
          <PaginationItem key={`ellipsis-${page}`}>
            <PaginationEllipsis />
          </PaginationItem>
        ) : (
          <PageButton key={page} page={page} currentPage={currentPage} basePath={basePath} />
        )
      )}
    </>
  );
}