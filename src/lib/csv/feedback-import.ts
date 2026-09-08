import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/errors';
import { upsertFeedbackEmbeddingsBatch } from '@/lib/embeddings/cohere';
import { classifyAndPersist } from '@/lib/ai/classifier';
import { logger } from '@/lib/logger';

/**
 * CSV feedback import.
 *
 * Runs entirely within a single Route Handler invocation (no background
 * workers, per Vercel serverless constraints) with hard bounds on file
 * size and row count so a single request can't exhaust function time or
 * memory.
 */

export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMPORT_ROWS = 1000;

/**
 * How many of the imported rows get classified SYNCHRONOUSLY, inside this
 * same request. Classifying all 1000 possible rows here would risk
 * exceeding a serverless function's execution time limit — so only the
 * first batch is auto-classified immediately; anything beyond this stays
 * `aiAnalyzed: false` and is picked up by the "Analyze pending feedback"
 * batch action (POST /api/ai/classify-batch), which the Inbox page calls
 * repeatedly until nothing is left.
 */
const MAX_AUTO_CLASSIFY_ON_IMPORT = 30;

const CHANNEL_VALUES = ['SUPPORT', 'APP_STORE', 'SURVEY', 'SALES', 'SOCIAL', 'MANUAL'] as const;

const csvRowSchema = z.object({
  content: z.string().trim().min(1, 'content is required'),
  channel: z.enum(CHANNEL_VALUES).default('MANUAL'),
  sourceRef: z.string().trim().max(300).optional().or(z.literal('')),
  customerLabel: z.string().trim().max(200).optional().or(z.literal('')),
  createdAt: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val, ctx) => {
      if (!val) return undefined;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'createdAt must be a valid date' });
        return z.NEVER;
      }
      return date;
    }),
  featureArea: z.string().trim().max(100).optional().or(z.literal('')),
});

export interface CsvImportError {
  row: number;
  message: string;
}

export interface CsvImportResult {
  imported: number;
  failed: number;
  autoClassified: number;
  errors: CsvImportError[];
}

/**
 * Minimal, dependency-free RFC-4180-ish CSV parser: handles quoted fields,
 * embedded commas, escaped quotes (""), and both \n and \r\n line endings.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
    } else if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && nextChar === '\n') i += 1;
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => !(row.length === 1 && row[0].trim() === ''));
}

function rowsToRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;
  const normalizedHeader = header.map((h) => h.trim());

  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    normalizedHeader.forEach((key, index) => {
      record[key] = row[index] ?? '';
    });
    return record;
  });
}

/**
 * Validates and imports feedback rows for `workspaceId`. Never trusts a
 * `workspaceId` column even if present in the CSV — every created row is
 * force-assigned to the authenticated caller's workspace.
 */
export async function importFeedbackFromCsv(
  csvText: string,
  workspaceId: string
): Promise<CsvImportResult> {
  const rows = parseCsv(csvText);
  const records = rowsToRecords(rows);

  if (records.length === 0) {
    throw new ValidationError('The CSV file contains no data rows.');
  }

  if (records.length > MAX_IMPORT_ROWS) {
    throw new ValidationError(`CSV files are limited to ${MAX_IMPORT_ROWS} rows.`);
  }

  const errors: CsvImportError[] = [];
  const createdIds: { feedbackId: string; content: string }[] = [];
  let imported = 0;

  for (let index = 0; index < records.length; index += 1) {
    const rowNumber = index + 2; // +1 for header, +1 for 1-based rows
    const parsed = csvRowSchema.safeParse(records[index]);

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.errors.map((e) => e.message).join('; '),
      });
      continue;
    }

    try {
      const data = parsed.data;
      const feedback = await prisma.feedback.create({
        data: {
          content: data.content,
          channel: data.channel,
          sourceRef: data.sourceRef || null,
          customerLabel: data.customerLabel || null,
          featureArea: data.featureArea || null,
          createdAt: data.createdAt,
          status: 'NEW',
          workspaceId, // never trust a workspaceId column from the file
        },
      });

      createdIds.push({ feedbackId: feedback.id, content: feedback.content });
      imported += 1;
    } catch (error) {
      logger.error('CSV row insert failed', {
        row: rowNumber,
        message: error instanceof Error ? error.message : String(error),
      });
      errors.push({ row: rowNumber, message: 'Failed to save this row.' });
    }
  }

  // Batch-embed every successfully imported row in one provider call rather
  // than one request per row.
  if (createdIds.length > 0) {
    try {
      await upsertFeedbackEmbeddingsBatch(createdIds);
    } catch (error) {
      logger.error('Batch embedding failed during CSV import', {
        count: createdIds.length,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Auto-classify the first MAX_AUTO_CLASSIFY_ON_IMPORT rows synchronously
  // so the reviewer isn't staring at 1000 "Unanalyzed" badges immediately
  // after import. Sequential and best-effort — one failure never blocks
  // the rest, and rows classified elsewhere (see the batch action) simply
  // stay aiAnalyzed:false until then.
  let autoClassified = 0;
  const toAutoClassify = createdIds.slice(0, MAX_AUTO_CLASSIFY_ON_IMPORT);
  for (const item of toAutoClassify) {
    try {
      await classifyAndPersist(item.feedbackId, workspaceId);
      autoClassified += 1;
    } catch (error) {
      logger.error('Auto-classification failed during CSV import', {
        feedbackId: item.feedbackId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    imported,
    failed: records.length - imported,
    autoClassified,
    errors,
  };
}