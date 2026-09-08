import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { ok, handleRouteError } from '@/lib/responses';
import { ValidationError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/security/rate-limit';
import {
  importFeedbackFromCsv,
  MAX_IMPORT_FILE_SIZE_BYTES,
} from '@/lib/csv/feedback-import';

/**
 * POST /api/feedback/import
 *
 * ADMIN/ANALYST. Accepts a multipart/form-data upload with a `file` field
 * containing a `.csv`. Every imported row is force-assigned to the
 * authenticated caller's workspace regardless of any column in the file.
 */

// This now also runs AI classification for a bounded number of rows (see
// MAX_AUTO_CLASSIFY_ON_IMPORT in feedback-import.ts), so it needs more time
// than the platform default. 60s is safe on Vercel Pro/Enterprise; on the
// Hobby tier this value is capped lower by the platform regardless — the
// import still completes safely either way, since classification failures
// are caught individually and never block the import itself.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    checkRateLimit({
      action: 'feedback:import',
      identifier: auth.workspaceId,
      limit: 5,
      windowMs: 60_000,
    });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new ValidationError('A CSV file must be provided under the "file" field.');
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new ValidationError('Only .csv files are accepted.');
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      throw new ValidationError(
        `File exceeds the maximum size of ${MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
      );
    }

    const csvText = await file.text();
    const result = await importFeedbackFromCsv(csvText, auth.workspaceId);

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}