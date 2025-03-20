import { PaginationUI } from "./pagination-ui";

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

/**
 * Server-side pagination component that uses URL path for navigation
 */
export function ServerPagination({
  currentPage,
  totalPages,
  basePath,
}: ServerPaginationProps) {
  // For server pagination, we don't need to handle clicks as we use URLs
  const onPageClick = () => { };

  // Generate the URL for a page
  const getHref = (page: number) => `${basePath}?page=${page}`;

  // Active link is the current page
  const isLinkActive = (page: number) => page === currentPage;

  return (
    <PaginationUI
      currentPage={currentPage}
      totalPages={totalPages}
      onPageClick={onPageClick}
      isLinkActive={isLinkActive}
      getHref={getHref}
    />
  );
}
