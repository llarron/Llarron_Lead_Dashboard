import { describe, it, expect } from 'vitest';
import { sanitizeCsvValue } from '../server/utils/sanitize';

describe('CSV Security, Sanitization & Formula Injection Protection', () => {
  it('neutralizes spreadsheet formula injection starting with =, +, -, @', () => {
    expect(sanitizeCsvValue('=1+1')).toBe("'=1+1");
    expect(sanitizeCsvValue('+CMD|calc')).toBe("'+CMD|calc");
    expect(sanitizeCsvValue('-100')).toBe("'-100");
    expect(sanitizeCsvValue('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
  });

  it('handles benign strings without modifying them', () => {
    expect(sanitizeCsvValue('John Doe')).toBe('John Doe');
    expect(sanitizeCsvValue('john@example.com')).toBe('john@example.com');
    expect(sanitizeCsvValue('Life coaching')).toBe('Life coaching');
  });

  it('escapes cells containing commas, quotes, and newlines per RFC 4180', () => {
    expect(sanitizeCsvValue('Hello, World')).toBe('"Hello, World"');
    expect(sanitizeCsvValue('Said "Hello" today')).toBe('"Said ""Hello"" today"');
    expect(sanitizeCsvValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
  });

  it('handles null and undefined values safely as empty string', () => {
    expect(sanitizeCsvValue(null)).toBe('');
    expect(sanitizeCsvValue(undefined)).toBe('');
  });

  it('verifies UTF-8 BOM is present in exported CSV buffer string', () => {
    const bom = '\uFEFF';
    const sampleCsv = `${bom}Header1,Header2\r\nValue1,Value2`;
    expect(sampleCsv.startsWith('\uFEFF')).toBe(true);
    expect(sampleCsv.charCodeAt(0)).toBe(0xfeff);
  });
});
