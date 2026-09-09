import { api, unwrap, unwrapPaginated } from './client';
import type { ReportDto, ReportSummaryDto, ApiSuccessPaginatedResponse } from '@/types';

export async function listReports(page = 1, limit = 10) {
  const response = await api.get<ApiSuccessPaginatedResponse<ReportSummaryDto>>('/reports', {
    params: { page, limit },
  });
  return unwrapPaginated<ReportSummaryDto>(response);
}

export async function getReport(id: string): Promise<ReportDto> {
  const response = await api.get<{ success: true; data: ReportDto }>(`/reports/${id}`);
  return unwrap(response);
}

export interface CreateReportPayload {
  title: string;
  periodStart: string; // ISO date, e.g. "2026-01-01"
  periodEnd: string;
}

export async function createReport(payload: CreateReportPayload): Promise<ReportDto> {
  const response = await api.post<{ success: true; data: ReportDto }>('/reports', payload);
  return unwrap(response);
}

/**
 * Downloads the real, server-generated PDF for a report as a Blob — this
 * endpoint returns raw `application/pdf` bytes, not the usual JSON
 * envelope, so it bypasses `unwrap()` entirely. Callers create an object
 * URL from the blob to trigger a browser download (see the report detail
 * page for the pattern).
 */
export async function downloadReportPdf(id: string): Promise<Blob> {
  const response = await api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}