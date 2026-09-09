import { api, unwrap } from './client';
import type { AskHermesxResponseDto } from '@/types';

export async function askHermesX(question: string): Promise<AskHermesxResponseDto> {
  const response = await api.post<{ success: true; data: AskHermesxResponseDto }>('/ask-hermesx', {
    question,
  });
  return unwrap(response);
}
