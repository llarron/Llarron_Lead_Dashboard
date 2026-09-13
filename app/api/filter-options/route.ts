import { NextRequest } from 'next/server';
import { FilterOptionsQuerySchema } from '@/server/validators/query.validator';
import { getFilterOptions } from '@/server/services/filter-options.service';
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

    const parsed = FilterOptionsQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return sendError(
        parsed.error.issues[0]?.message || 'Invalid query parameters.',
        400,
        parsed.error.format()
      );
    }

    const options = await getFilterOptions();
    return sendSuccess(options);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'DatabaseConnectionError' || err.name === 'DatabaseConfigurationError') {
      return sendError('Database service is currently unavailable. Please try again.', 503);
    }
    return sendError('Failed to fetch filter options. Please try again.', 500);
  }
}
