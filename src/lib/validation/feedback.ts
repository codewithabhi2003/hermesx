import { z } from 'zod';

const channelEnum = z.enum(['SUPPORT', 'APP_STORE', 'SURVEY', 'SALES', 'SOCIAL', 'MANUAL']);
const sentimentEnum = z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']);
const statusEnum = z.enum(['NEW', 'REVIEWED', 'ACTIONED']);

export const createFeedbackSchema = z.object({
  content: z.string().trim().min(1, 'Feedback content is required').max(10_000),
  channel: channelEnum.default('MANUAL'),
  sourceRef: z.string().trim().max(300).nullable().optional(),
  customerLabel: z.string().trim().max(200).nullable().optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const updateFeedbackSchema = z
  .object({
    content: z.string().trim().min(1).max(10_000).optional(),
    channel: channelEnum.optional(),
    sourceRef: z.string().trim().max(300).nullable().optional(),
    customerLabel: z.string().trim().max(200).nullable().optional(),
    status: statusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;

export const feedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  channel: channelEnum.optional(),
  sentiment: sentimentEnum.optional(),
  status: statusEnum.optional(),
  theme: z.string().trim().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'sentimentScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>;

export const feedbackIdParamSchema = z.object({
  id: z.string().trim().min(1, 'A valid feedback id is required'),
});
