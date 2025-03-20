import { PaginationUI } from "./pagination-ui";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onChangePage: (page: number) => void;
}

/**
 * Client-side pagination component that uses callbacks for navigation
 */
export function ClientPagination({
  currentPage,
  totalPages,
  onChangePage,
}: ClientPaginationProps) {
  return (
    <PaginationUI
      currentPage={currentPage}
      totalPages={totalPages}
      onPageClick={onChangePage}
      isLinkActive={(page) => page === currentPage}
      getHref={() => "#"} // Client pagination uses # for href and handles clicks via callback
    />
  );
}
