'use client';

import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  lastUpdated: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function Header({ lastUpdated, isLoading, onRefresh }: HeaderProps) {
  return (
    <header className="dashboard-header" role="banner">
      <div className="header-branding">
        <div className="header-logo-container">
          <Image
            src="/assets/llarron-logo.webp"
            alt="Llarron"
            width={120}
            height={36}
            priority
            style={{ width: 'auto', height: '32px', objectFit: 'contain' }}
          />
        </div>
        <div className="header-title-group">
          <h1>
            Lead Dashboard
            <span className="header-tag" aria-label="Environment: Internal Preview">
              Preview
            </span>
          </h1>
          <p className="header-subtitle">
            Read-only enquiry analytics & customer touchpoint history
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div className="refresh-status-text" aria-live="polite">
          {lastUpdated ? (
            <>
              Last updated: <strong>{lastUpdated}</strong>
            </>
          ) : (
            <em>Not updated yet</em>
          )}
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label={isLoading ? 'Refreshing dashboard data' : 'Refresh dashboard data'}
        >
          <svg
            className={isLoading ? 'spin' : ''}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
