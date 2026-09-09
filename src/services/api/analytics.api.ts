import { api, unwrap } from './client';
import type {
  AnalyticsOverviewDto,
  AnalyticsVolumeDto,
  AnalyticsSentimentDto,
  AnalyticsThemesDto,
  AnalyticsTrendsDto,
  AnalyticsPeriod,
} from '@/types';

export async function getOverview(): Promise<AnalyticsOverviewDto> {
  const response = await api.get<{ success: true; data: AnalyticsOverviewDto }>('/analytics/overview');
  return unwrap(response);
}

export async function getVolume(period: AnalyticsPeriod = '30d'): Promise<AnalyticsVolumeDto> {
  const response = await api.get<{ success: true; data: AnalyticsVolumeDto }>('/analytics/volume', {
    params: { period },
  });
  return unwrap(response);
}

export async function getSentiment(): Promise<AnalyticsSentimentDto> {
  const response = await api.get<{ success: true; data: AnalyticsSentimentDto }>('/analytics/sentiment');
  return unwrap(response);
}

export async function getThemeAnalytics(): Promise<AnalyticsThemesDto> {
  const response = await api.get<{ success: true; data: AnalyticsThemesDto }>('/analytics/themes');
  return unwrap(response);
}

/**
 * Daily sentiment time-series (NOT per-theme spike cards — see the note in
 * src/types/index.ts for why this endpoint's real shape is what it is).
 */
export async function getTrends(period: AnalyticsPeriod = '30d'): Promise<AnalyticsTrendsDto> {
  const response = await api.get<{ success: true; data: AnalyticsTrendsDto }>('/analytics/trends', {
    params: { period },
  });
  return unwrap(response);
}
