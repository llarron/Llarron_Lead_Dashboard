'use client';

import React from 'react';
import { LeadListItem } from '@/server/services/leads.service';
import { LeadDetailResponse } from '@/server/services/lead-detail.service';
import { formatToIstDateTime } from '@/server/utils/timezone';
import LeadDetailDrawer from './LeadDetailDrawer';

interface LeadTableProps {
  leads: LeadListItem[];
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  expandedLeadId: string | null;
  leadDetail: LeadDetailResponse | null;
  isDetailLoading: boolean;
  onToggleExpand: (leadId: string) => void;
  onRetry: () => void;
}

export default function LeadTable({
  leads,
  isLoading,
  error,
  page,
  limit,
  expandedLeadId,
  leadDetail,
  isDetailLoading,
  onToggleExpand,
  onRetry,
}: LeadTableProps) {
  if (error) {
    return (
      <div className="lead-table-container">
        <div className="error-state-box" role="alert">
          <div className="state-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="state-title">Unable to Load Leads</h3>
          <p className="state-desc">{error}</p>
          <button type="button" className="state-action-btn" onClick={onRetry}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && leads.length === 0) {
    return (
      <div className="lead-table-container">
        <div className="table-scroll-wrapper">
          <table className="lead-table" aria-label="Loading lead records">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Interest</th>
                <th>Status</th>
                <th>Created (IST)</th>
                <th>Enquiries</th>
                <th>Attribution</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx}>
                  <td colSpan={10} style={{ padding: '16px' }}>
                    <div className="skeleton-box" style={{ height: '24px', width: '100%' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!isLoading && leads.length === 0) {
    return (
      <div className="lead-table-container">
        <div className="empty-state-box">
          <div className="state-icon-circle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="state-title">No Leads Found</h3>
          <p className="state-desc">
            No leads match your active search or filter criteria for this date period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-table-container">
      <div className="table-scroll-wrapper">
        <table className="lead-table" aria-label="Lead contacts and enquiry table">
          <thead>
            <tr>
              <th scope="col" style={{ width: '45px' }}>#</th>
              <th scope="col">Name</th>
              <th scope="col">Phone</th>
              <th scope="col">Email</th>
              <th scope="col">Primary Interest</th>
              <th scope="col">Status</th>
              <th scope="col">Created Date & Time (IST)</th>
              <th scope="col" style={{ textAlign: 'center' }}>Enquiries</th>
              <th scope="col">Attribution</th>
              <th scope="col" style={{ textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => {
              const serialNo = (page - 1) * limit + index + 1;
              const isExpanded = expandedLeadId === lead.id;
              const detailPanelId = `lead-detail-${lead.id}`;

              return (
                <React.Fragment key={lead.id}>
                  <tr className={`lead-row ${isExpanded ? 'expanded' : ''}`}>
                    <td style={{ fontWeight: 600, color: 'var(--muted)' }}>{serialNo}</td>
                    <td style={{ fontWeight: 600 }}>{lead.name}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {lead.countryCode} {lead.phone}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--ink)' }}>{lead.email}</span>
                    </td>
                    <td>
                      <span className="badge badge-interest">
                        {lead.latestInterest || 'Not specified'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-status-${lead.status}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {formatToIstDateTime(lead.createdAt)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-count">{lead.consultationCount}</span>
                    </td>
                    <td>
                      <span className={`badge ${lead.isAttributed ? 'badge-attr-yes' : 'badge-attr-no'}`}>
                        {lead.isAttributed ? `UTM: ${lead.latestUtmSource || 'Tracked'}` : 'Direct'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="expand-toggle-btn"
                        onClick={() => onToggleExpand(lead.id)}
                        aria-expanded={isExpanded}
                        aria-controls={detailPanelId}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${lead.name}`}
                      >
                        <span>{isExpanded ? 'Hide' : 'View'}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr id={detailPanelId}>
                      <td colSpan={10} style={{ padding: 0 }}>
                        <LeadDetailDrawer
                          detail={leadDetail}
                          isLoading={isDetailLoading}
                          onClose={() => onToggleExpand(lead.id)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
