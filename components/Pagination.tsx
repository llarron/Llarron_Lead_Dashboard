'use client';

import React from 'react';

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function Pagination({
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <nav className="pagination-container" aria-label="Lead table pagination">
      <div className="pagination-info">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
        <strong>{total.toLocaleString()}</strong> leads
      </div>

      <div className="pagination-controls">
        <div className="limit-select-wrapper">
          <label htmlFor="limit-select">Rows per page:</label>
          <select
            id="limit-select"
            className="limit-select"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="Select number of rows per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="page-btn-group" role="group" aria-label="Page navigation">
          <button
            type="button"
            className="page-nav-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Go to previous page"
          >
            ← Prev
          </button>

          <span className="current-page-indicator">
            Page {page} of {totalPages || 1}
          </span>

          <button
            type="button"
            className="page-nav-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Go to next page"
          >
            Next →
          </button>
        </div>
      </div>
    </nav>
  );
}
