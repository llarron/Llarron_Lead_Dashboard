import { z } from 'zod';
import { isValidCalendarDate } from '../utils/timezone';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Reusable integer parser that strictly rejects floats, NaN, negative numbers, or partial strings like '1abc'
const strictPositiveInt = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === '') return defaultValue;
      if (!/^\d+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Must be a valid positive integer',
        });
        return z.NEVER;
      }
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Must be an integer greater than or equal to 1',
        });
        return z.NEVER;
      }
      return num;
    });

// Reusable limit parser that strictly rejects non-supported page limits
const strictLimit = (defaultValue: number = 25) =>
  z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val === '') return defaultValue;
      if (!/^\d+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Limit must be a valid number',
        });
        return z.NEVER;
      }
      const num = parseInt(val, 10);
      if (![10, 25, 50, 100].includes(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Limit must be one of 10, 25, 50, 100',
        });
        return z.NEVER;
      }
      return num;
    });

// Bounded string validator (max 100 characters) that strictly rejects oversized values
const boundedString = (fieldName: string) =>
  z
    .string()
    .max(100, `${fieldName} must not exceed 100 characters`)
    .optional();

/**
 * Base Date Period Schema
 */
export const DateRangeQuerySchema = z
  .object({
    period: z.enum(['today', '7days', 'custom']).default('today'),
    customStartDate: z
      .string()
      .regex(dateRegex, 'customStartDate must be in YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'customStartDate must be a real calendar date')
      .optional(),
    customEndDate: z
      .string()
      .regex(dateRegex, 'customEndDate must be in YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'customEndDate must be a real calendar date')
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.period === 'custom') {
        return !!data.customStartDate && !!data.customEndDate;
      }
      return true;
    },
    {
      message: 'Both customStartDate and customEndDate are required when period is custom',
      path: ['customStartDate'],
    }
  )
  .refine(
    (data) => {
      if (data.period === 'custom' && data.customStartDate && data.customEndDate) {
        return data.customStartDate <= data.customEndDate;
      }
      return true;
    },
    {
      message: 'customStartDate cannot be later than customEndDate',
      path: ['customStartDate'],
    }
  );

/**
 * Stats Query Schema
 */
export const StatsQuerySchema = DateRangeQuerySchema;

/**
 * Filter Options Query Schema
 */
export const FilterOptionsQuerySchema = DateRangeQuerySchema;

/**
 * Leads List Query Schema
 */
export const LeadsQuerySchema = z
  .object({
    period: z.enum(['today', '7days', 'custom']).default('today'),
    customStartDate: z
      .string()
      .regex(dateRegex, 'customStartDate must be in YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'customStartDate must be a real calendar date')
      .optional(),
    customEndDate: z
      .string()
      .regex(dateRegex, 'customEndDate must be in YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'customEndDate must be a real calendar date')
      .optional(),
    page: strictPositiveInt(1),
    limit: strictLimit(25),
    search: boundedString('Search query'),
    status: z.enum(['ACTIVE', 'DELETED', 'ONHOLD']).optional(),
    interest: boundedString('Interest filter'),
    utm_source: boundedString('UTM source filter'),
    utm_medium: boundedString('UTM medium filter'),
    utm_campaign: boundedString('UTM campaign filter'),
    sort: z.enum(['newest', 'oldest']).default('newest'),
  })
  .strict()
  .refine(
    (data) => {
      if (data.period === 'custom') {
        return !!data.customStartDate && !!data.customEndDate;
      }
      return true;
    },
    {
      message: 'Both customStartDate and customEndDate are required when period is custom',
      path: ['customStartDate'],
    }
  )
  .refine(
    (data) => {
      if (data.period === 'custom' && data.customStartDate && data.customEndDate) {
        return data.customStartDate <= data.customEndDate;
      }
      return true;
    },
    {
      message: 'customStartDate cannot be later than customEndDate',
      path: ['customStartDate'],
    }
  );

/**
 * Export Query Schema (identical to LeadsQuerySchema but without page/limit)
 */
export const ExportQuerySchema = z
  .object({
    period: z.enum(['today', '7days', 'custom']).default('today'),
    customStartDate: z
      .string()
      .regex(dateRegex, 'customStartDate must be in YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'customStartDate must be a real calendar date')
      .optional(),
    customEndDate: z
      .string()
      .regex(dateRegex, 'customEndDate must be in YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'customEndDate must be a real calendar date')
      .optional(),
    search: boundedString('Search query'),
    status: z.enum(['ACTIVE', 'DELETED', 'ONHOLD']).optional(),
    interest: boundedString('Interest filter'),
    utm_source: boundedString('UTM source filter'),
    utm_medium: boundedString('UTM medium filter'),
    utm_campaign: boundedString('UTM campaign filter'),
    sort: z.enum(['newest', 'oldest']).default('newest'),
  })
  .strict()
  .refine(
    (data) => {
      if (data.period === 'custom') {
        return !!data.customStartDate && !!data.customEndDate;
      }
      return true;
    },
    {
      message: 'Both customStartDate and customEndDate are required when period is custom',
      path: ['customStartDate'],
    }
  )
  .refine(
    (data) => {
      if (data.period === 'custom' && data.customStartDate && data.customEndDate) {
        return data.customStartDate <= data.customEndDate;
      }
      return true;
    },
    {
      message: 'customStartDate cannot be later than customEndDate',
      path: ['customStartDate'],
    }
  );

/**
 * Lead Detail ID Schema
 */
export const LeadIdSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid lead ID format. Must be a 24-character hexadecimal ObjectId.'),
});
