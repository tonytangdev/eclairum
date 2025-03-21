import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

    return {
      totalItems,
      totalPages,
      indexOfLastItem,
      indexOfFirstItem,
      currentItems,
    };
  }, [items, itemsPerPage, currentPage]);

  const navigateToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const navigateToNextPage = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const navigateToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // When adding a new item, check if we need to move to a new page
  const handleItemAdded = () => {
    if (items.length % itemsPerPage === 0) {
      setCurrentPage(Math.ceil((items.length + 1) / itemsPerPage));
    }
  };

  return {
    currentPage,
    setCurrentPage,
    navigateToPage,
    navigateToNextPage,
    navigateToPreviousPage,
    handleItemAdded,
    ...paginationData,
  };
}
