import { z } from 'zod';

export const createReportSchema = z
  .object({
    title: z.string().trim().min(1, 'Report title is required').max(200),
    periodStart: z.coerce.date({ errorMap: () => ({ message: 'A valid periodStart date is required' }) }),
    periodEnd: z.coerce.date({ errorMap: () => ({ message: 'A valid periodEnd date is required' }) }),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'periodEnd must be on or after periodStart',
    path: ['periodEnd'],
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const reportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ReportsQueryInput = z.infer<typeof reportsQuerySchema>;

export const reportIdParamSchema = z.object({
  id: z.string().trim().min(1, 'A valid report id is required'),
});

/**
 * Schema for the Groq-generated narrative. Must match the shared frontend
 * `ReportNarrative` type exactly — do not rename these fields.
 */
export const reportNarrativeSchema = z.object({
  executiveSummary: z.string().min(1),
  feedbackOverview: z.string().min(1),
  sentimentAnalysis: z.string().min(1),
  topThemes: z.string().min(1),
  majorChanges: z.string().min(1),
  recommendedActions: z.array(z.string().min(1)).max(8),
});

export type ReportNarrative = z.infer<typeof reportNarrativeSchema>;
