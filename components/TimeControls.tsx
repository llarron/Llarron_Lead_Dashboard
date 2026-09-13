'use client';

import React, { useState } from 'react';

export type DatePeriod = 'today' | '7days' | 'custom';

interface TimeControlsProps {
  period: DatePeriod;
  customStartDate?: string;
  customEndDate?: string;
  onPeriodChange: (period: DatePeriod, start?: string, end?: string) => void;
}

export default function TimeControls({
  period,
  customStartDate,
  customEndDate,
  onPeriodChange,
}: TimeControlsProps) {
  const [localStart, setLocalStart] = useState<string>(customStartDate || '');
  const [localEnd, setLocalEnd] = useState<string>(customEndDate || '');
  const [prevStart, setPrevStart] = useState<string | undefined>(customStartDate);
  const [prevEnd, setPrevEnd] = useState<string | undefined>(customEndDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize state when external date props change
  if (customStartDate !== prevStart || customEndDate !== prevEnd) {
    setPrevStart(customStartDate);
    setPrevEnd(customEndDate);
    setLocalStart(customStartDate || '');
    setLocalEnd(customEndDate || '');
  }

  const handlePresetClick = (newPeriod: 'today' | '7days') => {
    setValidationError(null);
    onPeriodChange(newPeriod);
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localStart || !localEnd) {
      setValidationError('Please select both start and end dates.');
      return;
    }
    if (localStart > localEnd) {
      setValidationError('Start date cannot be after end date.');
      return;
    }
    setValidationError(null);
    onPeriodChange('custom', localStart, localEnd);
  };

  return (
    <section className="time-controls-card" aria-label="Date and Time Controls">
      <div className="preset-buttons-group" role="group" aria-label="Time period presets">
        <button
          type="button"
          className={`preset-btn ${period === 'today' ? 'active' : ''}`}
          onClick={() => handlePresetClick('today')}
          aria-pressed={period === 'today'}
        >
          Today (IST)
        </button>
        <button
          type="button"
          className={`preset-btn ${period === '7days' ? 'active' : ''}`}
          onClick={() => handlePresetClick('7days')}
          aria-pressed={period === '7days'}
        >
          Last 7 Days
        </button>
        <button
          type="button"
          className={`preset-btn ${period === 'custom' ? 'active' : ''}`}
          onClick={() => {
            if (period !== 'custom') {
              const today = new Date().toISOString().split('T')[0];
              const start = localStart || today;
              const end = localEnd || today;
              setLocalStart(start);
              setLocalEnd(end);
              onPeriodChange('custom', start, end);
            }
          }}
          aria-pressed={period === 'custom'}
        >
          Custom Range
        </button>
      </div>

      {period === 'custom' && (
        <form className="custom-range-form" onSubmit={handleCustomApply} role="search">
          <div className="date-input-group">
            <label htmlFor="custom-start-date">From:</label>
            <input
              id="custom-start-date"
              type="date"
              className="date-input-field"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              required
            />
          </div>

          <div className="date-input-group">
            <label htmlFor="custom-end-date">To:</label>
            <input
              id="custom-end-date"
              type="date"
              className="date-input-field"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="apply-range-btn">
            Apply Range
          </button>

          {validationError && (
            <span className="error-text" role="alert" style={{ color: 'var(--clay)', fontSize: '12px', fontWeight: 600 }}>
              {validationError}
            </span>
          )}
        </form>
      )}
    </section>
  );
}
