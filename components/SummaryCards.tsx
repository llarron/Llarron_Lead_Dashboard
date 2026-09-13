'use client';

import React from 'react';
import { DashboardStats } from '@/server/services/stats.service';

interface SummaryCardsProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  if (isLoading || !stats) {
    return (
      <section className="summary-cards-grid" aria-label="Loading summary statistics">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="summary-card skeleton-box" style={{ height: '120px' }} />
        ))}
      </section>
    );
  }

  const {
    totalUniqueLeads,
    totalConsultations,
    attributedLeads,
    directLeads,
    topInterest,
    topSourceCampaign,
  } = stats;

  return (
    <section className="summary-cards-grid" aria-label="Dashboard Key Metrics">
      {/* 1. Total Unique Leads */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span>Unique Leads</span>
          <div className="summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <div className="summary-card-value">{totalUniqueLeads.toLocaleString()}</div>
        <div className="summary-card-subtext">New users created in period</div>
      </div>

      {/* 2. Total Consultation Enquiries */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span>Enquiries</span>
          <div className="summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
        <div className="summary-card-value">{totalConsultations.toLocaleString()}</div>
        <div className="summary-card-subtext">Consultation requests submitted</div>
      </div>

      {/* 3. Attributed vs Direct Leads */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span>Attribution Status</span>
          <div className="summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
        <div className="summary-card-value">
          {attributedLeads} <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 'normal' }}>attributed</span>
        </div>
        <div className="summary-card-subtext">
          <span>{directLeads} direct (no UTM touchpoint)</span>
        </div>
      </div>

      {/* 4. Top Area of Interest */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span>Top Interest</span>
          <div className="summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
        <div className="summary-card-value" style={{ fontSize: '20px', wordBreak: 'break-word' }}>
          {topInterest ? topInterest.name : 'No enquiries'}
        </div>
        <div className="summary-card-subtext">
          {topInterest ? `${topInterest.count} enquiries in period` : 'No consultation data'}
        </div>
      </div>

      {/* 5. Top Acquisition Source / Campaign */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span>Top Source</span>
          <div className="summary-card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </div>
        </div>
        <div className="summary-card-value" style={{ fontSize: '20px', wordBreak: 'break-word' }}>
          {topSourceCampaign ? topSourceCampaign.source : 'Direct / None'}
        </div>
        <div className="summary-card-subtext">
          {topSourceCampaign
            ? `${topSourceCampaign.campaign ? `Campaign: ${topSourceCampaign.campaign} • ` : ''}${topSourceCampaign.count} visits`
            : 'No campaigns recorded'}
        </div>
      </div>
    </section>
  );
}
