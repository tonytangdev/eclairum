/**
 * Calculate which page numbers to display in pagination
 * Returns an array of numbers or null (for ellipsis)
 */
export function calculateVisiblePages(
  currentPage: number,
  totalPages: number,
): (number | null)[] {
  // Always show first page
  const pages: (number | null)[] = [1];

  // Edge case: very few pages
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

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
