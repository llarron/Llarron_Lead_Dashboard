import { formatInTimeZone } from 'date-fns-tz';

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Checks whether a YYYY-MM-DD string represents a real, valid calendar date.
 * Rejects impossible dates like 2026-02-30, 2026-04-31, 2026-13-45.
 */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Days in month validation (accounting for leap years)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day <= daysInMonth[month - 1];
}

/**
 * Converts a YYYY-MM-DD string in Asia/Kolkata (IST, UTC+05:30) to its exact UTC start instant (00:00:00.000 IST).
 * 00:00:00.000 IST corresponds to 18:30:00.000 UTC of the previous calendar day.
 */
export function parseIstDateToUtcStart(dateStr: string): Date {
  if (!isValidCalendarDate(dateStr)) {
    throw new Error(`Invalid calendar date: ${dateStr}`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct UTC timestamp representing 00:00:00 IST by subtracting 5h30m (5.5 * 3600 * 1000 ms = 19,800,000 ms)
  const localMidnightAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  return new Date(localMidnightAsUtc - IST_OFFSET_MS);
}

/**
 * Gets the next day's date string (YYYY-MM-DD) for calculating exclusive upper bounds.
 */
export function getNextCalendarDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the current calendar date in Asia/Kolkata formatted as YYYY-MM-DD.
 */
export function getCurrentIstDateString(now: Date = new Date()): string {
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Calculates exact UTC query boundaries for the given period in Asia/Kolkata.
 * Query interval: createdAt >= startUTC && createdAt < endUTC
 */
export function getDateRangeBounds(
  period: 'today' | '7days' | 'custom',
  customStartDate?: string,
  customEndDate?: string,
  now: Date = new Date()
): { startUTC: Date; endUTC: Date; startDateStr: string; endDateStr: string } {
  const currentIst = getCurrentIstDateString(now);

  if (period === 'custom') {
    if (!customStartDate || !customEndDate) {
      throw new Error('Both customStartDate and customEndDate are required for custom range.');
    }
    if (!isValidCalendarDate(customStartDate) || !isValidCalendarDate(customEndDate)) {
      throw new Error('Invalid calendar date provided for custom range.');
    }
    if (customStartDate > customEndDate) {
      throw new Error('customStartDate cannot be later than customEndDate.');
    }

    const startUTC = parseIstDateToUtcStart(customStartDate);
    const nextDayStr = getNextCalendarDay(customEndDate);
    const endUTC = parseIstDateToUtcStart(nextDayStr);

    return {
      startUTC,
      endUTC,
      startDateStr: customStartDate,
      endDateStr: customEndDate,
    };
  }

  if (period === '7days') {
    // 7 days ending today (e.g. today - 6 days through today)
    const [year, month, day] = currentIst.split('-').map(Number);
    const startDateObj = new Date(Date.UTC(year, month - 1, day));
    startDateObj.setUTCDate(startDateObj.getUTCDate() - 6);

    const startYear = startDateObj.getUTCFullYear();
    const startMonth = String(startDateObj.getUTCMonth() + 1).padStart(2, '0');
    const startDay = String(startDateObj.getUTCDate()).padStart(2, '0');
    const startDateStr = `${startYear}-${startMonth}-${startDay}`;

    const startUTC = parseIstDateToUtcStart(startDateStr);
    const nextDayStr = getNextCalendarDay(currentIst);
    const endUTC = parseIstDateToUtcStart(nextDayStr);

    return {
      startUTC,
      endUTC,
      startDateStr,
      endDateStr: currentIst,
    };
  }

  // Default: 'today'
  const startUTC = parseIstDateToUtcStart(currentIst);
  const nextDayStr = getNextCalendarDay(currentIst);
  const endUTC = parseIstDateToUtcStart(nextDayStr);

  return {
    startUTC,
    endUTC,
    startDateStr: currentIst,
    endDateStr: currentIst,
  };
}

/**
 * Formats a Date object into human-readable IST string.
 * Example: '13 Sep 2026, 02:45:10 PM IST'
 */
export function formatToIstDateTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';
  return formatInTimeZone(d, TIMEZONE, 'dd MMM yyyy, hh:mm:ss a') + ' IST';
}

/**
 * Formats a Date object into IST date-only string.
 * Example: '13 Sep 2026'
 */
export function formatToIstDate(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';
  return formatInTimeZone(d, TIMEZONE, 'dd MMM yyyy');
}
