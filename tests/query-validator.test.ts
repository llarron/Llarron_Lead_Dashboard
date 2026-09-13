import { describe, it, expect } from 'vitest';
import {
  DateRangeQuerySchema,
  LeadsQuerySchema,
  LeadIdSchema,
  ExportQuerySchema,
} from '../server/validators/query.validator';
import { escapeRegex } from '../server/utils/sanitize';

describe('Strict Query Validation & Security Tests', () => {
  describe('Unknown Query Parameter Rejection', () => {
    it('rejects unknown query parameters with strict validation', () => {
      const result = LeadsQuerySchema.safeParse({
        period: 'today',
        unknownParam: 'malicious',
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown parameters in export schema', () => {
      const result = ExportQuerySchema.safeParse({
        period: 'today',
        injectParam: 'test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Date Range Validation', () => {
    it('accepts valid today and 7days period', () => {
      expect(DateRangeQuerySchema.safeParse({ period: 'today' }).success).toBe(true);
      expect(DateRangeQuerySchema.safeParse({ period: '7days' }).success).toBe(true);
    });

    it('accepts valid custom range with both dates', () => {
      const res = DateRangeQuerySchema.safeParse({
        period: 'custom',
        customStartDate: '2026-09-01',
        customEndDate: '2026-09-10',
      });
      expect(res.success).toBe(true);
    });

    it('rejects missing or partial custom dates', () => {
      const res1 = DateRangeQuerySchema.safeParse({
        period: 'custom',
        customStartDate: '2026-09-01',
      });
      expect(res1.success).toBe(false);

      const res2 = DateRangeQuerySchema.safeParse({
        period: 'custom',
        customEndDate: '2026-09-10',
      });
      expect(res2.success).toBe(false);
    });

    it('rejects impossible calendar dates (e.g. Feb 30, April 31)', () => {
      const res = DateRangeQuerySchema.safeParse({
        period: 'custom',
        customStartDate: '2026-02-30',
        customEndDate: '2026-03-05',
      });
      expect(res.success).toBe(false);
    });

    it('rejects reversed date ranges', () => {
      const res = DateRangeQuerySchema.safeParse({
        period: 'custom',
        customStartDate: '2026-09-20',
        customEndDate: '2026-09-10',
      });
      expect(res.success).toBe(false);
    });

    it('rejects unsupported period values', () => {
      expect(DateRangeQuerySchema.safeParse({ period: 'last_month' }).success).toBe(false);
      expect(DateRangeQuerySchema.safeParse({ period: '1year' }).success).toBe(false);
    });
  });

  describe('Pagination & Number Validation', () => {
    it('accepts valid page and limit values', () => {
      const res = LeadsQuerySchema.safeParse({
        page: '1',
        limit: '25',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(1);
        expect(res.data.limit).toBe(25);
      }
    });

    it('rejects partial number strings like 1abc', () => {
      const res1 = LeadsQuerySchema.safeParse({ page: '1abc' });
      expect(res1.success).toBe(false);

      const res2 = LeadsQuerySchema.safeParse({ limit: '25xyz' });
      expect(res2.success).toBe(false);
    });

    it('rejects negative or zero page numbers', () => {
      expect(LeadsQuerySchema.safeParse({ page: '0' }).success).toBe(false);
      expect(LeadsQuerySchema.safeParse({ page: '-5' }).success).toBe(false);
    });

    it('rejects non-standard limit values (only 10, 25, 50, 100 allowed)', () => {
      expect(LeadsQuerySchema.safeParse({ limit: '35' }).success).toBe(false);
      expect(LeadsQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
      expect(LeadsQuerySchema.safeParse({ limit: '1' }).success).toBe(false);
    });
  });

  describe('Oversized Search and Filter Rejection', () => {
    it('strictly rejects search queries longer than 100 characters', () => {
      const longString = 'a'.repeat(101);
      const res = LeadsQuerySchema.safeParse({ search: longString });
      expect(res.success).toBe(false);
    });

    it('strictly rejects oversized filter values (> 100 characters)', () => {
      const longInterest = 'i'.repeat(105);
      expect(LeadsQuerySchema.safeParse({ interest: longInterest }).success).toBe(false);

      const longUtm = 'u'.repeat(105);
      expect(LeadsQuerySchema.safeParse({ utm_source: longUtm }).success).toBe(false);
    });

    it('safely accepts search queries under 100 characters', () => {
      const normalSearch = 'John Doe';
      const res = LeadsQuerySchema.safeParse({ search: normalSearch });
      expect(res.success).toBe(true);
    });
  });

  describe('Regex Special Character Escaping', () => {
    it('escapes all special regex characters properly to prevent ReDoS', () => {
      const rawInput = 'user+test[123].*?^$()|\\';
      const escaped = escapeRegex(rawInput);
      expect(escaped).toBe('user\\+test\\[123\\]\\.\\*\\?\\^\\$\\(\\)\\|\\\\');

      // Verify it can safely compile into RegExp without syntax errors
      expect(() => new RegExp(escaped, 'i')).not.toThrow();
    });
  });

  describe('MongoDB ObjectId Validation', () => {
    it('accepts valid 24-hex-character ObjectId strings', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(LeadIdSchema.safeParse({ id: validId }).success).toBe(true);
    });

    it('rejects malformed or invalid ObjectId strings', () => {
      expect(LeadIdSchema.safeParse({ id: '123' }).success).toBe(false);
      expect(LeadIdSchema.safeParse({ id: '507f1f77bcf86cd79943901z' }).success).toBe(false); // Invalid hex char 'z'
      expect(LeadIdSchema.safeParse({ id: '507f1f77bcf86cd79943901' }).success).toBe(false); // 23 chars
      expect(LeadIdSchema.safeParse({ id: '' }).success).toBe(false);
    });
  });
});
