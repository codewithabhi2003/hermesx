import { api, unwrap } from './client';
import type { ThemeDto } from '@/types';

export async function listThemes(): Promise<ThemeDto[]> {
  const response = await api.get<{ success: true; data: ThemeDto[] }>('/themes');
  return unwrap(response);
}

export interface CreateThemePayload {
  name: string;
  description?: string;
  color?: string;
}

export async function createTheme(payload: CreateThemePayload): Promise<ThemeDto> {
  const response = await api.post<{ success: true; data: ThemeDto }>('/themes', payload);
  return unwrap(response);
}

export interface UpdateThemePayload {
  name?: string;
  description?: string;
  color?: string;
}

export async function updateTheme(id: string, payload: UpdateThemePayload): Promise<ThemeDto> {
  const response = await api.patch<{ success: true; data: ThemeDto }>(`/themes/${id}`, payload);
  return unwrap(response);
}

export async function deleteTheme(id: string): Promise<void> {
  await api.delete(`/themes/${id}`);
}
