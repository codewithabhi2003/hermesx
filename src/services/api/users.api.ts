import { api, unwrap } from './client';
import type { UserDto, Role } from '@/types';

export async function listUsers(): Promise<UserDto[]> {
  const response = await api.get<{ success: true; data: UserDto[] }>('/users');
  return unwrap(response);
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export async function createUser(payload: CreateUserPayload): Promise<UserDto> {
  const response = await api.post<{ success: true; data: UserDto }>('/users', payload);
  return unwrap(response);
}

export interface UpdateUserPayload {
  name?: string;
  role?: Role;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserDto> {
  const response = await api.patch<{ success: true; data: UserDto }>(`/users/${id}`, payload);
  return unwrap(response);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
