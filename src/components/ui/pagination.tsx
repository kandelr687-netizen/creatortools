import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getPages = () => {
    const pages: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  if (totalPages <= 1) return null

  const btnClass = "h-8 w-8 rounded-md border text-sm flex items-center justify-center transition-colors hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"

  return (
    <div className={cn("flex items-center justify-between mt-6", className)}>
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          className={btnClass}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          &laquo;
        </button>
        {getPages().map((p, i) =>
          typeof p === 'number' ? (
            <button
              key={i}
              className={cn(btnClass, p === page && "bg-primary text-primary-foreground border-primary")}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="h-8 px-1 flex items-center text-sm text-muted-foreground">...</span>
          )
        )}
        <button
          className={btnClass}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          &raquo;
        </button>
      </div>
    </div>
  )
}
