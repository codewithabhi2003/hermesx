import { z } from 'zod';

export const trendsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
});

export type TrendsQueryInput = z.infer<typeof trendsQuerySchema>;
