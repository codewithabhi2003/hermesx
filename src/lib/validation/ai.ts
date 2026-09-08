import { z } from 'zod';

export const classifyBatchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(20),
});

export type ClassifyBatchInput = z.infer<typeof classifyBatchSchema>;