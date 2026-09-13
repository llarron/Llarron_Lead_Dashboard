import { NextRequest } from 'next/server';
import { LeadIdSchema } from '@/server/validators/query.validator';
import { getLeadDetailById } from '@/server/services/lead-detail.service';
import { sendSuccess, sendError } from '@/server/utils/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const parsed = LeadIdSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      return sendError(
        'Invalid lead ID format. Must be a 24-character hexadecimal ObjectId.',
        400
      );
    }

    const lead = await getLeadDetailById(parsed.data.id);
    if (!lead) {
      return sendError('Lead record not found.', 404);
    }

    return sendSuccess(lead);
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'DatabaseConnectionError' || err.name === 'DatabaseConfigurationError') {
      return sendError('Database service is currently unavailable. Please try again.', 503);
    }
    return sendError('Failed to fetch lead details. Please try again.', 500);
  }
}
