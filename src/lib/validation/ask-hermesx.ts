import { z } from 'zod';

export const askHermesxSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, 'Question must be at least 3 characters long')
    .max(1000, 'Question must be under 1000 characters'),
});

export type AskHermesxInput = z.infer<typeof askHermesxSchema>;
