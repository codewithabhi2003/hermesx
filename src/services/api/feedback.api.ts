import { api, unwrap, unwrapPaginated } from './client';
import type {
  FeedbackDto,
  CsvImportResultDto,
  AppStoreSyncResultDto,
  ClassifyBatchResultDto,
  Channel,
  Sentiment,
  Status,
  ApiSuccessPaginatedResponse,
} from '@/types';

export interface FeedbackListParams {
  page?: number;
  limit?: number;
  search?: string;
  channel?: Channel;
  sentiment?: Sentiment;
  status?: Status;
  theme?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'sentimentScore';
  sortOrder?: 'asc' | 'desc';
}

export async function listFeedback(params: FeedbackListParams = {}) {
  const response = await api.get<ApiSuccessPaginatedResponse<FeedbackDto>>('/feedback', { params });
  return unwrapPaginated<FeedbackDto>(response);
}

export async function getFeedback(id: string): Promise<FeedbackDto> {
  const response = await api.get<{ success: true; data: FeedbackDto }>(`/feedback/${id}`);
  return unwrap(response);
}

export interface CreateFeedbackPayload {
  content: string;
  channel?: Channel;
  sourceRef?: string;
  customerLabel?: string;
}

export async function createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackDto> {
  const response = await api.post<{ success: true; data: FeedbackDto }>('/feedback', payload);
  return unwrap(response);
}

export interface UpdateFeedbackPayload {
  content?: string;
  channel?: Channel;
  sourceRef?: string | null;
  customerLabel?: string | null;
  status?: Status;
}

export async function updateFeedback(id: string, payload: UpdateFeedbackPayload): Promise<FeedbackDto> {
  const response = await api.patch<{ success: true; data: FeedbackDto }>(`/feedback/${id}`, payload);
  return unwrap(response);
}

export async function deleteFeedback(id: string): Promise<void> {
  await api.delete(`/feedback/${id}`);
}

export async function importFeedbackCsv(file: File): Promise<CsvImportResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ success: true; data: CsvImportResultDto }>(
    '/feedback/import',
    formData,
    // Clearing Content-Type (rather than setting 'multipart/form-data')
    // lets the browser attach the correct boundary itself — setting the
    // header explicitly here would omit that boundary and break the upload.
    { headers: { 'Content-Type': undefined } }
  );
  return unwrap(response);
}

export async function syncAppStoreFeedback(count?: number): Promise<AppStoreSyncResultDto> {
  const response = await api.post<{ success: true; data: AppStoreSyncResultDto }>(
    '/sources/app-store/sync',
    count ? { count } : {}
  );
  return unwrap(response);
}

export async function classifyFeedback(feedbackId: string): Promise<FeedbackDto> {
  const response = await api.post<{ success: true; data: FeedbackDto }>(`/ai/classify/${feedbackId}`);
  return unwrap(response);
}

export async function reclassifyFeedback(feedbackId: string): Promise<FeedbackDto> {
  const response = await api.post<{ success: true; data: FeedbackDto }>(`/ai/reclassify/${feedbackId}`);
  return unwrap(response);
}

/**
 * Classifies up to `limit` unanalyzed feedback items in one call. Callers
 * (see the Inbox page's "Analyze pending" button) should call this in a
 * loop, using the returned `remaining` count to decide whether to call
 * again, rather than expecting one call to clear an entire backlog.
 */
export async function classifyBatch(limit = 20): Promise<ClassifyBatchResultDto> {
  const response = await api.post<{ success: true; data: ClassifyBatchResultDto }>('/ai/classify-batch', {
    limit,
  });
  return unwrap(response);
}