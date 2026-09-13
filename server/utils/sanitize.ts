/**
 * Escapes regex special characters to prevent ReDoS or unintended pattern matching in MongoDB regex queries.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Neutralizes spreadsheet formula injection in CSV cells.
 * Any cell value starting with '=', '+', '-', or '@' is prepended with a single quote (').
 */
export function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  let str = String(value);

  // Neutralize formula injection
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 escaping: if value contains quote, comma, or newline, escape quotes and wrap in double quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
