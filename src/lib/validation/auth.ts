import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128),
  workspaceName: z.string().trim().min(1, 'Workspace name is required').max(160),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
