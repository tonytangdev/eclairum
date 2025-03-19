"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
}

export function PaginationBar({ currentPage, totalPages }: PaginationBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Function to create URL with updated page parameter
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Generate the array of page numbers to display
  const generatePagination = () => {
    // If there are 7 or fewer pages, show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Complex pagination with ellipses
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      // Show first pages and ... at the end
      const leftItemCount = 5;
      return [
        ...Array.from({ length: leftItemCount }, (_, i) => i + 1),
        "...",
        totalPages,
      ];
    }

    if (showLeftDots && !showRightDots) {
      // Show ... at the beginning and last pages
      const rightItemCount = 5;
      return [
        1,
        "...",
        ...Array.from(
          { length: rightItemCount },
          (_, i) => totalPages - rightItemCount + i + 1
        ),
      ];
    }

    if (showLeftDots && showRightDots) {
      // Show ... at both sides
      return [
        1,
        "...",
        leftSiblingIndex,
        currentPage,
        rightSiblingIndex,
        "...",
        totalPages,
      ];
    }

    // Default fallback
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pages = generatePagination();

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage <= 1}
        asChild={currentPage > 1}
      >
        {currentPage > 1 ? (
          <Link href={createPageURL(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {pages.map((page, i) => (
        <div key={i}>
          {page === "..." ? (
            <Button variant="outline" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              className={currentPage === page ? "pointer-events-none" : ""}
              asChild={currentPage !== page}
            >
              {currentPage !== page ? (
                <Link href={createPageURL(page)}>
                  {page}
                </Link>
              ) : (
                <>{page}</>
              )}
            </Button>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageURL(currentPage + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
