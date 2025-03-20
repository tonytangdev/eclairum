"use client";

import React from "react";
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

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Client-side pagination component using callbacks
 * Fully interactive with keyboard navigation support
 */
export function ClientPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "mt-8",
}: ClientPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: number
  ) => {
    e.preventDefault();
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    page: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (page !== currentPage) {
        onPageChange(page);
      }
    }
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* Previous button */}
        <PaginationItem>
          {currentPage > 1 ? (
            <PaginationPrevious
              href="#"
              onClick={(e) => handlePageClick(e, currentPage - 1)}
              onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
            />
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
                  href="#"
                  isActive={page === currentPage}
                  onClick={(e) => handlePageClick(e, page)}
                  onKeyDown={(e) => handleKeyDown(e, page)}
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
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => handlePageClick(e, page)}
                    onKeyDown={(e) => handleKeyDown(e, page)}
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
            <PaginationNext
              href="#"
              onClick={(e) => handlePageClick(e, currentPage + 1)}
              onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
            />
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
