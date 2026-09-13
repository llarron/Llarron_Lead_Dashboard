'use client';

import React, { useState, useEffect } from 'react';
import { FilterOptionsResponse } from '@/server/services/filter-options.service';

export interface FilterState {
  search: string;
  status: string;
  interest: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  sort: 'newest' | 'oldest';
}

interface FilterBarProps {
  filters: FilterState;
  filterOptions: FilterOptionsResponse | null;
  isExporting: boolean;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onExportCsv: () => void;
}

export default function FilterBar({
  filters,
  filterOptions,
  isExporting,
  onFilterChange,
  onClearFilters,
  onExportCsv,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [prevSearch, setPrevSearch] = useState(filters.search);

  // Synchronize state when parent reset occurs (e.g. Clear Filters)
  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setSearchInput(filters.search || '');
  }

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, filters.search, onFilterChange]);

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.interest) ||
    Boolean(filters.utm_source) ||
    Boolean(filters.utm_medium) ||
    Boolean(filters.utm_campaign) ||
    filters.sort !== 'newest';

  return (
    <section className="filter-bar-card" aria-label="Search and Filter Controls">
      <div className="filter-bar-primary-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search leads by name, email, or phone..."
            value={searchInput}
            maxLength={100}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search leads by name, email, or phone"
          />
        </div>

        {/* Action Buttons */}
        <div className="filter-actions-group">
          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={onClearFilters}
              aria-label="Clear all applied filters"
            >
              Clear Filters
            </button>
          )}

          <button
            type="button"
            className="export-csv-btn"
            onClick={onExportCsv}
            disabled={isExporting}
            aria-label={isExporting ? 'Exporting CSV file' : 'Export leads to CSV'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Secondary Row: Specific Dropdown Filters */}
      <div className="filter-selects-row">
        {/* Area of Interest */}
        <select
          className="filter-select"
          value={filters.interest || ''}
          onChange={(e) => onFilterChange({ interest: e.target.value })}
          aria-label="Filter by Area of Interest"
        >
          <option value="">All Interests</option>
          {filterOptions?.interests.map((interest) => (
            <option key={interest} value={interest}>
              {interest}
            </option>
          ))}
        </select>

        {/* User Status */}
        <select
          className="filter-select"
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          aria-label="Filter by System Status"
        >
          <option value="">All Statuses</option>
          {filterOptions?.statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* UTM Source */}
        <select
          className="filter-select"
          value={filters.utm_source || ''}
          onChange={(e) => onFilterChange({ utm_source: e.target.value })}
          aria-label="Filter by UTM Source"
        >
          <option value="">All Sources</option>
          {filterOptions?.utmSources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        {/* UTM Medium */}
        <select
          className="filter-select"
          value={filters.utm_medium || ''}
          onChange={(e) => onFilterChange({ utm_medium: e.target.value })}
          aria-label="Filter by UTM Medium"
        >
          <option value="">All Mediums</option>
          {filterOptions?.utmMediums.map((med) => (
            <option key={med} value={med}>
              {med}
            </option>
          ))}
        </select>

        {/* UTM Campaign */}
        <select
          className="filter-select"
          value={filters.utm_campaign || ''}
          onChange={(e) => onFilterChange({ utm_campaign: e.target.value })}
          aria-label="Filter by UTM Campaign"
        >
          <option value="">All Campaigns</option>
          {filterOptions?.utmCampaigns.map((camp) => (
            <option key={camp} value={camp}>
              {camp}
            </option>
          ))}
        </select>

        {/* Sorting */}
        <select
          className="filter-select"
          value={filters.sort || 'newest'}
          onChange={(e) => onFilterChange({ sort: e.target.value as 'newest' | 'oldest' })}
          aria-label="Sort Order"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
        </select>
      </div>
    </section>
  );
}
