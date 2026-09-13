import { NextRequest } from 'next/server';
import { StatsQuerySchema } from '@/server/validators/query.validator';
import { getDashboardStats } from '@/server/services/stats.service';
import { sendSuccess, sendError } from '@/server/utils/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      rawParams[key] = val;
    });

    const parsed = StatsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return sendError(
        firstIssue?.message || 'Invalid query parameters.',
        400,
        parsed.error.format()
      );
    }

    const { period, customStartDate, customEndDate } = parsed.data;
    const stats = await getDashboardStats(period, customStartDate, customEndDate);

    return sendSuccess(stats);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'DatabaseConnectionError' || err.name === 'DatabaseConfigurationError') {
      return sendError('Database service is currently unavailable. Please try again.', 503);
    }
    return sendError('Failed to fetch dashboard statistics. Please try again.', 500);
  }
}
