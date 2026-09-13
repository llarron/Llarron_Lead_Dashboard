'use client';

import React from 'react';
import { LeadDetailResponse } from '@/server/services/lead-detail.service';
import { formatToIstDateTime } from '@/server/utils/timezone';

interface LeadDetailDrawerProps {
  detail: LeadDetailResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function LeadDetailDrawer({
  detail,
  isLoading,
  onClose,
}: LeadDetailDrawerProps) {
  if (isLoading) {
    return (
      <div className="detail-expansion-panel" aria-busy="true" aria-label="Loading lead details">
        <div className="skeleton-box" style={{ height: '180px' }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="detail-expansion-panel">
        <p style={{ color: 'var(--clay)', fontSize: '13px', fontWeight: 600 }}>
          Could not load details for this lead.
        </p>
      </div>
    );
  }

  const { user, consultations, touchpoints, isAttributed } = detail;

  return (
    <div className="detail-expansion-panel" role="region" aria-label={`Details for ${user.name}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clay)' }}>
            Complete User History (All-Time)
          </span>
          <h3 style={{ fontFamily: 'var(--font-fraunces), serif', fontSize: '18px', color: 'var(--ink)' }}>
            {user.name} ({user.countryCode} {user.phone})
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="clear-filters-btn"
          style={{ fontSize: '12px', padding: '4px 10px' }}
          aria-label="Close detail panel"
        >
          Close Panel ✕
        </button>
      </div>

      <div className="detail-expansion-grid">
        {/* Section 1: Demographics & Profile */}
        <div className="detail-section-card">
          <h4 className="detail-section-title">Lead Information</h4>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)', width: '35%' }}>Email:</td>
                <td style={{ padding: '4px 0', fontWeight: 600 }}>{user.email}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Phone:</td>
                <td style={{ padding: '4px 0', fontWeight: 600 }}>{user.countryCode} {user.phone}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Timezone:</td>
                <td style={{ padding: '4px 0' }}>{user.timezone}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Status:</td>
                <td style={{ padding: '4px 0' }}>
                  <span className={`badge badge-status-${user.status}`}>{user.status}</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>First Created:</td>
                <td style={{ padding: '4px 0', fontSize: '12px' }}>{formatToIstDateTime(user.createdAt)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--muted)' }}>Last Updated:</td>
                <td style={{ padding: '4px 0', fontSize: '12px' }}>{formatToIstDateTime(user.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Consultation History */}
        <div className="detail-section-card">
          <h4 className="detail-section-title">
            <span>Consultation Enquiries</span>
            <span className="badge badge-count">{consultations.length}</span>
          </h4>

          {consultations.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>
              No consultation records found.
            </p>
          ) : (
            <div className="timeline-list">
              {consultations.map((c) => (
                <div key={c.id} className="timeline-item">
                  <div className="timeline-timestamp">{formatToIstDateTime(c.createdAt)}</div>
                  <div className="timeline-title">
                    Area: <span style={{ color: 'var(--green)' }}>{c.interest}</span>
                  </div>
                  {c.message && (
                    <div className="timeline-body">
                      &ldquo;{c.message}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: UTM Touchpoint Timeline */}
        <div className="detail-section-card">
          <h4 className="detail-section-title">
            <span>Campaign Touchpoints</span>
            <span className={`badge ${isAttributed ? 'badge-attr-yes' : 'badge-attr-no'}`}>
              {isAttributed ? `${touchpoints.length} Touchpoints` : 'Direct Lead'}
            </span>
          </h4>

          {!isAttributed || touchpoints.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px', fontStyle: 'italic' }}>
              No UTM tracking parameters captured. This lead visited directly.
            </p>
          ) : (
            <div className="timeline-list">
              {touchpoints.map((t) => (
                <div key={t.id} className="timeline-item">
                  <div className="timeline-timestamp">{formatToIstDateTime(t.createdAt)}</div>
                  <div className="timeline-title">
                    Source: <strong>{t.utm_source || 'Unknown'}</strong>
                    {t.utm_medium ? ` • Medium: ${t.utm_medium}` : ''}
                  </div>
                  <div className="timeline-body" style={{ fontSize: '12px' }}>
                    {t.utm_campaign && <div><strong>Campaign:</strong> {t.utm_campaign}</div>}
                    {t.utm_content && <div><strong>Content:</strong> {t.utm_content}</div>}
                    {t.utm_term && <div><strong>Term:</strong> {t.utm_term}</div>}
                    {t.route && <div><strong>Landing Route:</strong> {t.route}</div>}
                    {t.platform && <div><strong>Platform:</strong> {t.platform}</div>}
                    {t.gclid && <div><strong>GCLID:</strong> <code style={{ fontSize: '11px' }}>{t.gclid}</code></div>}
                    {t.fbclid && <div><strong>FBCLID:</strong> <code style={{ fontSize: '11px' }}>{t.fbclid}</code></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
