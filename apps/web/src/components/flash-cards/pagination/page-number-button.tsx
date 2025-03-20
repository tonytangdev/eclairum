"use client";

import React from "react";
import { PaginationItem, PaginationLink } from "@/components/ui/pagination";

interface PageNumberButtonProps {
  page: number;
  onPageClick: (page: number) => void;
  isLinkActive: (page: number) => boolean;
  getHref: (page: number) => string;
}

/**
 * Client component for page number buttons in pagination
 */
export function PageNumberButton({
  page,
  onPageClick,
  isLinkActive,
  getHref,
}: PageNumberButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Only prevent default and invoke callback if using client-side navigation (href is "#")
    if (getHref(page) === "#") {
      e.preventDefault();
      onPageClick(page);
    }
  };

  return (
    <PaginationItem>
      <PaginationLink
        href={getHref(page)}
        isActive={isLinkActive(page)}
        onClick={handleClick}
      >
        {page}
      </PaginationLink>
    </PaginationItem>
  );
}
