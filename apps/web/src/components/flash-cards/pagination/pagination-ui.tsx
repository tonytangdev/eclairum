import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,

  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PageNumberButton } from "./page-number-button";

export interface PaginationUIProps {
  currentPage: number;
  totalPages: number;
  onPageClick: (page: number) => void;
  isLinkActive?: (page: number) => boolean;
  getHref?: (page: number) => string;
}

/**
 * Pure presentational pagination component without any business logic
 */
export function PaginationUI({
  currentPage,
  totalPages,
  onPageClick,
  isLinkActive = (page) => page === currentPage,
  getHref = () => "#",
}: PaginationUIProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PreviousPageButton
          currentPage={currentPage}
          onPageClick={onPageClick}
          getHref={getHref}
        />

        {totalPages < 5 ? (
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageClick={onPageClick}
            isLinkActive={isLinkActive}
            getHref={getHref}
          />
        ) : (
          <ComplexPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageClick={onPageClick}
            isLinkActive={isLinkActive}
            getHref={getHref}
          />
        )}

        <NextPageButton
          currentPage={currentPage}
          totalPages={totalPages}
          onPageClick={onPageClick}
          getHref={getHref}
        />
      </PaginationContent>
    </Pagination>
  );
}

function PreviousPageButton({
  currentPage,
  onPageClick,
  getHref,
}: Pick<PaginationUIProps, "currentPage" | "onPageClick" | "getHref">) {
  const isDisabled = currentPage <= 1;
  const prevPage = currentPage - 1;

  return (
    <PaginationItem>
      {!isDisabled ? (
        <PaginationPrevious
          href={getHref(prevPage)}
          onClick={(e) => {
            if (getHref(prevPage) === "#") {
              e.preventDefault();
              onPageClick(prevPage);
            }
          }}
        />
      ) : (
        <PaginationPrevious
          href="#"
          aria-disabled="true"
          className="pointer-events-none opacity-50"
        />
      )}
    </PaginationItem>
  );
}

function NextPageButton({
  currentPage,
  totalPages,
  onPageClick,
  getHref,
}: Pick<PaginationUIProps, "currentPage" | "totalPages" | "onPageClick" | "getHref">) {
  const isDisabled = currentPage >= totalPages;
  const nextPage = currentPage + 1;

  return (
    <PaginationItem>
      {!isDisabled ? (
        <PaginationNext
          href={getHref(nextPage)}
          onClick={(e) => {
            if (getHref(nextPage) === "#") {
              e.preventDefault();
              onPageClick(nextPage);
            }
          }}
        />
      ) : (
        <PaginationNext
          href="#"
          aria-disabled="true"
          className="pointer-events-none opacity-50"
        />
      )}
    </PaginationItem>
  );
}

function SimplePagination({
  currentPage,
  totalPages,
  onPageClick,
  isLinkActive,
  getHref,
}: PaginationUIProps) {
  return (
    <>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <PageNumberButton
          key={page}
          page={page}
          onPageClick={onPageClick}
          isLinkActive={isLinkActive}
          getHref={getHref}
        />
      ))}
    </>
  );
}

function ComplexPagination({
  currentPage,
  totalPages,
  onPageClick,
  isLinkActive,
  getHref,
}: PaginationUIProps) {
  // Calculate which page numbers to show
  const pages = calculateVisiblePages(currentPage, totalPages);

  return (
    <>
      {pages.map((page, index) =>
        page === null ? (
          <PaginationItem key={`ellipsis-${index}`}>
            <PaginationEllipsis />
          </PaginationItem>
        ) : (
          <PageNumberButton
            key={page}
            page={page}
            onPageClick={onPageClick}
            isLinkActive={isLinkActive}
            getHref={getHref}
          />
        )
      )}
    </>
  );
}

/**
 * Calculate which page numbers to display in pagination
 * Returns an array of numbers or null (for ellipsis)
 */
function calculateVisiblePages(currentPage: number, totalPages: number): (number | null)[] {
  const pages: (number | null)[] = [1];

  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - 1);
  let rangeEnd = Math.min(totalPages - 1, currentPage + 1);

  // Adjust range for edge cases
  if (currentPage <= 3) {
    rangeStart = 2;
    rangeEnd = Math.min(5, totalPages - 1);
  } else if (currentPage >= totalPages - 2) {
    rangeStart = Math.max(2, totalPages - 4);
    rangeEnd = totalPages - 1;
  }

  // Add left ellipsis if needed
  if (rangeStart > 2) {
    pages.push(null);
  }

  // Add middle pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add right ellipsis if needed
  if (rangeEnd < totalPages - 1) {
    pages.push(null);
  }

  // Always add last page if there's more than one page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
