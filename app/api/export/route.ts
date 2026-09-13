import { NextRequest, NextResponse } from 'next/server';
import { ExportQuerySchema } from '@/server/validators/query.validator';
import { generateLeadsCsv } from '@/server/services/export.service';
import { sendError } from '@/server/utils/response';
import { getCurrentIstDateString } from '@/server/utils/timezone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      rawParams[key] = val;
    });

    const parsed = ExportQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return sendError(
        parsed.error.issues[0]?.message || 'Invalid export query parameters.',
        400,
        parsed.error.format()
      );
    }

    const csvContent = await generateLeadsCsv(parsed.data);
    const currentDateStr = getCurrentIstDateString();
    const filename = `llarron-leads-${currentDateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, private',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'DatabaseConnectionError' || err.name === 'DatabaseConfigurationError') {
      return sendError('Database service is currently unavailable. Please try again.', 503);
    }
    return sendError('Failed to generate export file. Please try again.', 500);
  }
}
