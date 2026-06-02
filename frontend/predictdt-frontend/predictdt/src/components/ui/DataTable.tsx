import React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  toolbarActions?: React.ReactNode;
  actions?: (row: T) => React.ReactNode;
  emptyText?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="table-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T extends { id: string }>({
  columns, data, loading, totalPages = 1, currentPage = 0,
  onPageChange, search, onSearch, searchPlaceholder = 'Buscar...', toolbarActions, actions, emptyText,
}: DataTableProps<T>) {
  return (
    <div className="glass-card overflow-hidden">
      {(onSearch || toolbarActions) && (
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderColor: '#30363D' }}>
          {onSearch ? (
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input-field pl-8"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          ) : <span />}
          {toolbarActions && (
            <div className="flex items-center gap-2">
              {toolbarActions}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #30363D' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={columns.length + (actions ? 1 : 0)} />
                ))
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <Inbox size={32} className="opacity-40" />
                      <span className="text-sm">{emptyText || 'Nenhum registro encontrado'}</span>
                    </div>
                  </td>
                </tr>
              )
              : data.map((row) => (
                <tr key={row.id} className="table-row">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#30363D' }}>
          <span className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Página {currentPage + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-ghost px-2 py-1"
              disabled={currentPage === 0}
              onClick={() => onPageChange?.(currentPage - 1)}
              style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="btn-ghost px-2 py-1"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange?.(currentPage + 1)}
              style={{ opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
