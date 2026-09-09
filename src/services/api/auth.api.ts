import { api, unwrap } from './client';
import type { SignupResponseDto } from '@/types';

/**
 * Login and logout are NOT here — they go through NextAuth's `signIn()` /
 * `signOut()` directly from components (see the login page). This file
 * only covers the one custom auth endpoint: workspace + first-admin
 * signup, which is a plain REST call and does not establish a session by
 * itself.
 */

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

export async function signup(payload: SignupPayload): Promise<SignupResponseDto> {
  const response = await api.post<{ success: true; data: SignupResponseDto }>(
    '/auth/signup',
    payload
  );
  return unwrap(response);
}
