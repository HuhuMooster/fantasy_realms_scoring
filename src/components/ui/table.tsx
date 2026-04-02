import { cn } from '@/lib/utils'

interface IColumn<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface ITableProps<T> {
  columns: IColumn<T>[]
  rows: T[]
  keyFn: (row: T) => string
  className?: string
  emptyText?: string
}

export function Table<T>({
  columns,
  rows,
  keyFn,
  className = '',
  emptyText = 'No results.',
}: ITableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="table table-zebra">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-base-content/50 py-8"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={keyFn(row)}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
