import { describe, it, expect } from 'vitest';
import {
  isValidCalendarDate,
  parseIstDateToUtcStart,
  getNextCalendarDay,
  getDateRangeBounds,
  formatToIstDateTime,
  formatToIstDate,
} from '../server/utils/timezone';

describe('Asia/Kolkata Timezone & Date Calculations', () => {
  it('validates real calendar dates correctly', () => {
    expect(isValidCalendarDate('2026-09-13')).toBe(true);
    expect(isValidCalendarDate('2026-02-28')).toBe(true);
    expect(isValidCalendarDate('2028-02-29')).toBe(true); // Leap year
    expect(isValidCalendarDate('2026-12-31')).toBe(true);

    // Impossible or invalid dates
    expect(isValidCalendarDate('2026-02-29')).toBe(false); // Non-leap year
    expect(isValidCalendarDate('2026-02-30')).toBe(false);
    expect(isValidCalendarDate('2026-04-31')).toBe(false);
    expect(isValidCalendarDate('2026-13-01')).toBe(false);
    expect(isValidCalendarDate('2026-00-10')).toBe(false);
    expect(isValidCalendarDate('invalid-date')).toBe(false);
    expect(isValidCalendarDate('2026-09')).toBe(false);
    expect(isValidCalendarDate('2026/09/13')).toBe(false);
  });

  it('converts 00:00:00 IST to exact 18:30:00 UTC of previous day', () => {
    const utcDate = parseIstDateToUtcStart('2026-09-13');
    // 2026-09-13 00:00:00 IST is 2026-09-12 18:30:00 UTC
    expect(utcDate.toISOString()).toBe('2026-09-12T18:30:00.000Z');
  });

  it('handles year transitions correctly (e.g. 1 Jan 2027 IST -> 31 Dec 2026 18:30 UTC)', () => {
    const utcDate = parseIstDateToUtcStart('2027-01-01');
    expect(utcDate.toISOString()).toBe('2026-12-31T18:30:00.000Z');
  });

  it('handles month transitions correctly (e.g. 1 March 2026 IST -> 28 Feb 2026 18:30 UTC)', () => {
    const utcDate = parseIstDateToUtcStart('2026-03-01');
    expect(utcDate.toISOString()).toBe('2026-02-28T18:30:00.000Z');
  });

  it('calculates next calendar day accurately across months and years', () => {
    expect(getNextCalendarDay('2026-09-13')).toBe('2026-09-14');
    expect(getNextCalendarDay('2026-02-28')).toBe('2026-03-01');
    expect(getNextCalendarDay('2028-02-28')).toBe('2028-02-29'); // Leap year
    expect(getNextCalendarDay('2028-02-29')).toBe('2028-03-01');
    expect(getNextCalendarDay('2026-12-31')).toBe('2027-01-01');
  });

  it('computes today date boundaries with exclusive upper bound in Asia/Kolkata', () => {
    // Simulated fixed time: 2026-09-13 14:00:00 IST (2026-09-13 08:30:00 UTC)
    const mockNow = new Date('2026-09-13T08:30:00.000Z');
    const { startUTC, endUTC, startDateStr, endDateStr } = getDateRangeBounds('today', undefined, undefined, mockNow);

    expect(startDateStr).toBe('2026-09-13');
    expect(endDateStr).toBe('2026-09-13');
    expect(startUTC.toISOString()).toBe('2026-09-12T18:30:00.000Z');
    expect(endUTC.toISOString()).toBe('2026-09-13T18:30:00.000Z');
  });

  it('computes 7days date boundaries accurately', () => {
    const mockNow = new Date('2026-09-13T08:30:00.000Z');
    const { startUTC, endUTC, startDateStr, endDateStr } = getDateRangeBounds('7days', undefined, undefined, mockNow);

    expect(startDateStr).toBe('2026-09-07');
    expect(endDateStr).toBe('2026-09-13');
    expect(startUTC.toISOString()).toBe('2026-09-06T18:30:00.000Z');
    expect(endUTC.toISOString()).toBe('2026-09-13T18:30:00.000Z');
  });

  it('computes custom date range boundaries accurately', () => {
    const { startUTC, endUTC, startDateStr, endDateStr } = getDateRangeBounds(
      'custom',
      '2026-09-01',
      '2026-09-10'
    );

    expect(startDateStr).toBe('2026-09-01');
    expect(endDateStr).toBe('2026-09-10');
    expect(startUTC.toISOString()).toBe('2026-08-31T18:30:00.000Z');
    expect(endUTC.toISOString()).toBe('2026-09-10T18:30:00.000Z');
  });

  it('throws error for invalid or reversed custom date ranges', () => {
    expect(() => getDateRangeBounds('custom', '2026-09-15', '2026-09-10')).toThrow(
      'customStartDate cannot be later than customEndDate'
    );
    expect(() => getDateRangeBounds('custom', '2026-02-30', '2026-03-05')).toThrow(
      'Invalid calendar date provided'
    );
  });

  it('formats dates into IST strings correctly', () => {
    const testDate = new Date('2026-09-13T08:30:00.000Z'); // 14:00:00 IST
    expect(formatToIstDate(testDate)).toBe('13 Sep 2026');
    expect(formatToIstDateTime(testDate)).toBe('13 Sep 2026, 02:00:00 PM IST');
  });
});
