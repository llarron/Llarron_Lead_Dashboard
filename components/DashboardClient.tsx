'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './Header';
import TimeControls, { DatePeriod } from './TimeControls';
import SummaryCards from './SummaryCards';
import FilterBar, { FilterState } from './FilterBar';
import LeadTable from './LeadTable';
import Pagination from './Pagination';
import { DashboardStats } from '@/server/services/stats.service';
import { LeadListItem } from '@/server/services/leads.service';
import { FilterOptionsResponse } from '@/server/services/filter-options.service';
import { LeadDetailResponse } from '@/server/services/lead-detail.service';
import { formatToIstDateTime } from '@/server/utils/timezone';

export default function DashboardClient() {
  // 1. Period & Filter State
  const [period, setPeriod] = useState<DatePeriod>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    interest: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    sort: 'newest',
  });

  // 2. Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);

  // 3. Expansion State
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [leadDetail, setLeadDetail] = useState<LeadDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // 4. Loading & Status State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Race condition & cancellation refs
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const detailAbortControllerRef = useRef<AbortController | null>(null);

  // Build query string helper
  const buildQueryParams = useCallback(
    (includePagination = true) => {
      const params = new URLSearchParams();
      params.set('period', period);
      if (period === 'custom' && customStartDate && customEndDate) {
        params.set('customStartDate', customStartDate);
        params.set('customEndDate', customEndDate);
      }

      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.interest) params.set('interest', filters.interest);
      if (filters.utm_source) params.set('utm_source', filters.utm_source);
      if (filters.utm_medium) params.set('utm_medium', filters.utm_medium);
      if (filters.utm_campaign) params.set('utm_campaign', filters.utm_campaign);
      if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);

      if (includePagination) {
        params.set('page', String(page));
        params.set('limit', String(limit));
      }

      return params.toString();
    },
    [period, customStartDate, customEndDate, filters, page, limit]
  );

  // Main coordinated data loader
  const fetchDashboardData = useCallback(async () => {
    // Increment request token to invalidate in-flight calls
    const currentRequestId = ++requestIdRef.current;

    // Abort previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);

    const statsQuery = new URLSearchParams({ period });
    if (period === 'custom' && customStartDate && customEndDate) {
      statsQuery.set('customStartDate', customStartDate);
      statsQuery.set('customEndDate', customEndDate);
    }

    const leadsQuery = buildQueryParams(true);
    const filterOptionsQuery = new URLSearchParams({ period });
    if (period === 'custom' && customStartDate && customEndDate) {
      filterOptionsQuery.set('customStartDate', customStartDate);
      filterOptionsQuery.set('customEndDate', customEndDate);
    }

    try {
      const [statsRes, leadsRes, optionsRes] = await Promise.all([
        fetch(`/api/stats?${statsQuery.toString()}`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch(`/api/leads?${leadsQuery}`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch(`/api/filter-options?${filterOptionsQuery.toString()}`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        }),
      ]);

      if (currentRequestId !== requestIdRef.current) {
        return; // Stale response discarded
      }

      const [statsJson, leadsJson, optionsJson] = await Promise.all([
        statsRes.json(),
        leadsRes.json(),
        optionsRes.json(),
      ]);

      if (!statsRes.ok || !leadsRes.ok || !optionsRes.ok) {
        const errorMsg =
          leadsJson.error || statsJson.error || optionsJson.error || 'Failed to fetch dashboard data.';
        throw new Error(errorMsg);
      }

      // If all succeeded, update state atomically
      setStats(statsJson.data);
      setLeads(leadsJson.data.leads);
      setPagination(leadsJson.data.pagination);
      setFilterOptions(optionsJson.data);
      setError(null);
      setLastUpdated(formatToIstDateTime(new Date()));
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      if (currentRequestId === requestIdRef.current) {
        setError((err as Error).message || 'Service is temporarily unavailable. Please retry.');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [period, customStartDate, customEndDate, buildQueryParams]);

  // Load initial data and on filter/page changes
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!ignore) {
        await fetchDashboardData();
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [fetchDashboardData]);

  // Sync URL search params without page reload
  useEffect(() => {
    const qs = buildQueryParams(true);
    const newUrl = `${window.location.pathname}?${qs}`;
    window.history.replaceState(null, '', newUrl);
  }, [buildQueryParams]);

  // Handle Period Change (Resets page to 1)
  const handlePeriodChange = (newPeriod: DatePeriod, start?: string, end?: string) => {
    setPeriod(newPeriod);
    if (start) setCustomStartDate(start);
    if (end) setCustomEndDate(end);
    setPage(1);
    setExpandedLeadId(null);
  };

  // Handle Filter Change (Resets page to 1)
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
    setExpandedLeadId(null);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      interest: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      sort: 'newest',
    });
    setPage(1);
    setExpandedLeadId(null);
  };

  // Expand / Collapse Single Lead Row
  const handleToggleExpand = async (leadId: string) => {
    if (expandedLeadId === leadId) {
      // Toggle closed
      setExpandedLeadId(null);
      setLeadDetail(null);
      return;
    }

    // Open new lead detail
    setExpandedLeadId(leadId);
    setLeadDetail(null);
    setIsDetailLoading(true);

    if (detailAbortControllerRef.current) {
      detailAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    detailAbortControllerRef.current = controller;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLeadDetail(json.data);
      } else {
        setLeadDetail(null);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setLeadDetail(null);
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  // CSV Export Trigger
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const exportQuery = buildQueryParams(false);
      const response = await fetch(`/api/export?${exportQuery}`);
      if (!response.ok) {
        throw new Error('Failed to generate CSV export.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `llarron-leads-${period}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Unable to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header with Refresh and Last Updated */}
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={fetchDashboardData}
      />

      {/* Security & Access Notice */}
      <div className="security-notice-banner" role="status">
        <div>
          <span className="security-notice-badge">Notice:</span>
          Public Lead Management View. Restrict URL sharing to authorized personnel.
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Timezone: <strong>Asia/Kolkata (IST)</strong>
        </div>
      </div>

      {/* Time Controls */}
      <TimeControls
        period={period}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onPeriodChange={handlePeriodChange}
      />

      {/* Summary KPI Cards */}
      <SummaryCards stats={stats} isLoading={isLoading && !stats} />

      {/* Search and Filters */}
      <FilterBar
        filters={filters}
        filterOptions={filterOptions}
        isExporting={isExporting}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onExportCsv={handleExportCsv}
      />

      {/* Leads Table */}
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        error={error}
        page={pagination.page}
        limit={pagination.limit}
        expandedLeadId={expandedLeadId}
        leadDetail={leadDetail}
        isDetailLoading={isDetailLoading}
        onToggleExpand={handleToggleExpand}
        onRetry={fetchDashboardData}
      />

      {/* Pagination */}
      {!error && leads.length > 0 && (
        <Pagination
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => {
            setPage(newPage);
            setExpandedLeadId(null);
          }}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
            setExpandedLeadId(null);
          }}
        />
      )}
    </div>
  );
}
