import { z } from 'zod';

/**
 * Profile photos are stored as base64 data URLs directly in the database
 * (no cloud storage is configured for this project) — so the size limit
 * here caps the DATABASE ROW SIZE, not just a nice-to-have. 1.4M base64
 * characters decodes to roughly 1MB of binary image data, which is already
 * generous for an avatar; the frontend resizes images before upload so
 * real payloads should be far smaller than this ceiling in practice.
 */
const MAX_AVATAR_DATA_URL_LENGTH = 1_400_000;

const avatarUrlSchema = z
  .string()
  .refine((val) => val.startsWith('data:image/'), 'Avatar must be an image data URL')
  .refine((val) => val.length <= MAX_AVATAR_DATA_URL_LENGTH, 'Avatar image is too large')
  .nullable();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120).optional(),
    email: z.string().trim().toLowerCase().email('A valid email is required').optional(),
    avatarUrl: avatarUrlSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
