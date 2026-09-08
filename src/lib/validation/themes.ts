import { z } from 'zod';

const hexColor = /^#[0-9A-Fa-f]{6}$/;

export const createThemeSchema = z.object({
  name: z.string().trim().min(1, 'Theme name is required').max(100),
  description: z.string().trim().max(500).nullable().optional(),
  color: z.string().regex(hexColor, 'Color must be a valid hex code').default('#6366F1'),
});

export type CreateThemeInput = z.infer<typeof createThemeSchema>;

export const updateThemeSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    color: z.string().regex(hexColor, 'Color must be a valid hex code').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

export const themeIdParamSchema = z.object({
  id: z.string().trim().min(1, 'A valid theme id is required'),
});
