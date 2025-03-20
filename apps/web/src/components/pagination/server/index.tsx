import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { calculateVisiblePages } from "../utils";

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  /**
   * Optional query parameter name for the page (defaults to "page")
   */
  pageQueryParam?: string;
}

/**
 * Server-side pagination component that uses URL navigation
 * No client-side JavaScript required
 */
export function ServerPagination({
  currentPage,
  totalPages,
  basePath,
  pageQueryParam = "page",
}: ServerPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageUrl = (page: number): string =>
    `${basePath}?${pageQueryParam}=${page}`;

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {/* Previous button */}
        <PaginationItem>
          {currentPage > 1 ? (
            <PaginationPrevious href={getPageUrl(currentPage - 1)} />
          ) : (
            <PaginationPrevious
              href="#"
              aria-disabled="true"
              className="pointer-events-none opacity-50"
            />
          )}
        </PaginationItem>

        {/* Page numbers */}
        {totalPages <= 7 ? (
          // Simple pagination for few pages
          <>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={getPageUrl(page)}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
          </>
        ) : (
          // Complex pagination with ellipsis for many pages
          <>
            {calculateVisiblePages(currentPage, totalPages).map((page, index) =>
              page === null ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={getPageUrl(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
          </>
        )}

        {/* Next button */}
        <PaginationItem>
          {currentPage < totalPages ? (
            <PaginationNext href={getPageUrl(currentPage + 1)} />
          ) : (
            <PaginationNext
              href="#"
              aria-disabled="true"
              className="pointer-events-none opacity-50"
            />
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
