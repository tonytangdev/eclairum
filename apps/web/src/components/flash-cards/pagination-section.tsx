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
  onChangePage: (page: number) => void;
  basePath?: string;
  mode?: 'client' | 'server';
}

export function PaginationSection({
  currentPage,
  totalPages,
  onChangePage,
  basePath = '',
  mode = 'client'
}: PaginationSectionProps) {
  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PreviousButton
          currentPage={currentPage}
          onChangePage={onChangePage}
          basePath={basePath}
          mode={mode}
        />
        {totalPages < 5 ? (
          <Under6PagesButtons
            currentPage={currentPage}
            totalPages={totalPages}
            onChangePage={onChangePage}
            basePath={basePath}
            mode={mode}
          />
        ) : (
          <Over5PagesButtons
            currentPage={currentPage}
            totalPages={totalPages}
            onChangePage={onChangePage}
            basePath={basePath}
            mode={mode}
          />
        )}
        <NextButton
          currentPage={currentPage}
          totalPages={totalPages}
          onChangePage={onChangePage}
          basePath={basePath}
          mode={mode}
        />
      </PaginationContent>
    </Pagination>
  );
}

interface ButtonProps {
  currentPage: number;
  onChangePage: (page: number) => void;
  basePath: string;
  mode: 'client' | 'server';
}

function PreviousButton({ currentPage, onChangePage, basePath, mode }: ButtonProps) {
  const prevPage = currentPage - 1;
  const isDisabled = currentPage <= 1;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled || mode === 'server') return;
    e.preventDefault();
    onChangePage(prevPage);
  };

  return (
    <PaginationItem key="prev">
      {!isDisabled ? (
        <PaginationPrevious
          href={mode === 'server' ? `${basePath}?page=${prevPage}` : "#"}
          onClick={handleClick}
        />
      ) : (
        <PaginationPrevious href="#" aria-disabled="true" className="pointer-events-none opacity-50" />
      )}
    </PaginationItem>
  );
}

interface NextButtonProps extends ButtonProps {
  totalPages: number;
}

function NextButton({ currentPage, totalPages, onChangePage, basePath, mode }: NextButtonProps) {
  const nextPage = currentPage + 1;
  const isDisabled = currentPage >= totalPages;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled || mode === 'server') return;
    e.preventDefault();
    onChangePage(nextPage);
  };

  return (
    <PaginationItem key="next">
      {!isDisabled ? (
        <PaginationNext
          href={mode === 'server' ? `${basePath}?page=${nextPage}` : "#"}
          onClick={handleClick}
        />
      ) : (
        <PaginationNext href="#" aria-disabled="true" className="pointer-events-none opacity-50" />
      )}
    </PaginationItem>
  );
}

interface PageButtonProps extends ButtonProps {
  page: number;
}

function PageButton({ page, currentPage, onChangePage, basePath, mode }: PageButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (mode === 'server') return;
    e.preventDefault();
    onChangePage(page);
  };

  return (
    <PaginationItem key={page}>
      <PaginationLink
        href={mode === 'server' ? `${basePath}?page=${page}` : "#"}
        isActive={currentPage === page}
        onClick={handleClick}
      ></PaginationLink>
      {page}
    </PaginationLink>
    </PaginationItem >
  );
}

interface PagesButtonsProps extends ButtonProps {
  totalPages: number;
}

function Under6PagesButtons({ currentPage, totalPages, onChangePage, basePath, mode }: PagesButtonsProps) {
  return (
    <></>
      {
    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
      <PageButton
        key={page}
        page={page}
        currentPage={currentPage}
        onChangePage={onChangePage}
        basePath={basePath}
        mode={mode}
      />
    ))
  }
    </>
  );
}

function Over5PagesButtons({ currentPage, totalPages, onChangePage, basePath, mode }: PagesButtonsProps) {
  const pages = [1];

  let rangeStart = Math.max(2, currentPage - 1);
  let rangeEnd = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 3) {
    rangeStart = 2;
    rangeEnd = Math.min(5, totalPages - 1);
  } else if (currentPage >= totalPages - 2) {
    rangeStart = Math.max(2, totalPages - 4);
    rangeEnd = totalPages - 1;
  }

  if (rangeStart > 2) {
    pages.push(-1);
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < totalPages - 1) {
    pages.push(-2);
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <></>
      {
    pages.map(page =>
      page < 0 ? (
          <PaginationItem key={`ellipsis-${page}`}></PaginationItem>
            <PaginationEllipsis />
          </PaginationItem >
        ) : (
      <PageButton
        key={page}
        page={page}
        currentPage={currentPage}
        onChangePage={onChangePage}
        basePath={basePath}
        mode={mode}
      />
    )
      )
  }
    </>
  );
}

// Server-side pagination wrapper
export function ServerPaginationSection({
  currentPage,
  totalPages,
  basePath,
}: Omit<PaginationSectionProps, 'onChangePage' | 'mode'> & { basePath: string }) {
  const onChangePage = () => { };

  return (
    <PaginationSection
      currentPage={currentPage}
      totalPages={totalPages}
      onChangePage={onChangePage}
      basePath={basePath}
      mode="server"
    />
  );
}

// Client-side pagination wrapper
export function ClientPaginationSection({
  currentPage,
  totalPages,
  onChangePage,
}: Omit<PaginationSectionProps, 'basePath' | 'mode'>) {
  return (
    <PaginationSection
      currentPage={currentPage}
      totalPages={totalPages}
      onChangePage={onChangePage}
      mode="client"
    />
  );
}