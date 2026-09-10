import { api, unwrap } from './client';
import type { ProfileDto, ChangePasswordResponseDto } from '@/types';

export async function getProfile(): Promise<ProfileDto> {
  const response = await api.get<{ success: true; data: ProfileDto }>('/profile');
  return unwrap(response);
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileDto> {
  const response = await api.patch<{ success: true; data: ProfileDto }>('/profile', payload);
  return unwrap(response);
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResponseDto> {
  const response = await api.patch<{ success: true; data: ChangePasswordResponseDto }>(
    '/profile/password',
    payload
  );
  return unwrap(response);
}
