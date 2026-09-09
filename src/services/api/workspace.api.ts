import { api, unwrap } from './client';
import type { WorkspaceDto } from '@/types';

export async function getWorkspace(): Promise<WorkspaceDto> {
  const response = await api.get<{ success: true; data: WorkspaceDto }>('/workspace');
  return unwrap(response);
}

export async function updateWorkspace(name: string): Promise<WorkspaceDto> {
  const response = await api.patch<{ success: true; data: WorkspaceDto }>('/workspace', { name });
  return unwrap(response);
}
