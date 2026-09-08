/**
 * Shared API type contract.
 *
 * These types describe EXACTLY what each route in `src/app/api/**` returns,
 * not an idealized guess — they were written by reading the actual
 * `toFeedbackDto()` / `select` / `include` shapes in each route handler.
 * If a route's response shape ever changes, update the matching type here
 * in the same commit so this file never drifts from reality.
 *
 * Enums are redeclared as string literal unions (rather than imported from
 * `@prisma/client`) so this file has zero Prisma dependency and can be
 * copied into a separate frontend project if HermesX's UI ever lives in
 * its own codebase.
 *
 * Deliberate deviations from the frontend master prompt's assumed shapes
 * (kept because they reflect the real, tested backend rather than a
 * generic guess):
 * - `FeedbackDto.themes` is a FLAT array (`{id,name,color,confidence}[]`),
 *   not a nested `{theme:{...},confidence}[]`.
 * - `/api/analytics/trends` returns a daily POSITIVE/NEGATIVE/NEUTRAL
 *   time series (`AnalyticsTrendsDto`), not per-theme period-comparison
 *   cards — that data lives in `/api/analytics/themes` instead
 *   (`AnalyticsThemesDto`), which has no "previous period" comparison.
 *   The Trends page is built around what these two endpoints actually
 *   return; see `docs/FRONTEND_INTEGRATION.md` for the full reasoning.
 * - `AnalyticsSentimentDto` nests `percentages` rather than using flat
 *   `*Percent` fields, and includes an `unclassified` bucket.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type Role = 'ADMIN' | 'ANALYST' | 'VIEWER';

export type Channel = 'SUPPORT' | 'APP_STORE' | 'SURVEY' | 'SALES' | 'SOCIAL' | 'MANUAL';

export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type Status = 'NEW' | 'REVIEWED' | 'ACTIONED';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

// ---------------------------------------------------------------------------
// Envelope (matches lib/responses.ts exactly)
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
export type ApiPaginatedResponse<T> = ApiSuccessPaginatedResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Auth — POST /api/auth/signup
// ---------------------------------------------------------------------------

export interface SignupResponseDto {
  workspaceId: string;
  userId: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Workspace — GET/PATCH /api/workspace
// ---------------------------------------------------------------------------

export interface WorkspaceDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Users — /api/users, /api/users/:id
// ---------------------------------------------------------------------------

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  workspaceId: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

// ---------------------------------------------------------------------------
// Profile — /api/profile, /api/profile/password (self-service, any role)
// ---------------------------------------------------------------------------

/** Identical shape to UserDto — kept as a distinct name since it's a different endpoint's contract. */
export type ProfileDto = UserDto;

export interface ChangePasswordResponseDto {
  success: true;
}

// ---------------------------------------------------------------------------
// Feedback — /api/feedback, /api/feedback/:id
// ---------------------------------------------------------------------------

/** Theme attached to a piece of feedback, as embedded in FeedbackDto.themes. */
export interface FeedbackThemeTagDto {
  id: string;
  name: string;
  color: string;
  confidence: number;
}

export interface FeedbackDto {
  id: string;
  content: string;
  channel: Channel;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: Sentiment | null;
  sentimentScore: number | null;
  featureArea: string | null;
  aiRationale: string | null;
  status: Status;
  aiAnalyzed: boolean;
  classifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  themes: FeedbackThemeTagDto[];
}

export interface CsvImportErrorDto {
  row: number;
  message: string;
}

/** POST /api/feedback/import response. */
export interface CsvImportResultDto {
  imported: number;
  failed: number;
  autoClassified: number;
  errors: CsvImportErrorDto[];
}

/** POST /api/sources/app-store/sync response. */
export interface AppStoreSyncResultDto {
  synced: number;
}

/** POST /api/ai/classify-batch response. */
export interface ClassifyBatchResultDto {
  processed: number;
  remaining: number;
}

// ---------------------------------------------------------------------------
// Themes — /api/themes, /api/themes/:id
// ---------------------------------------------------------------------------

export interface ThemeDto {
  id: string;
  name: string;
  description: string | null;
  color: string;
  workspaceId: string;
  feedbackCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Analytics — /api/analytics/*
// ---------------------------------------------------------------------------

export interface TopThemeCountDto {
  id: string;
  name: string;
  color: string;
  count: number;
}

/** GET /api/analytics/overview */
export interface AnalyticsOverviewDto {
  totalFeedback: number;
  positive: number;
  negative: number;
  neutral: number;
  actioned: number;
  newThisWeek: number;
  aiAnalyzed: number;
  topThemes: TopThemeCountDto[];
}

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface VolumeSeriesPointDto {
  date: string; // YYYY-MM-DD
  count: number;
}

/** GET /api/analytics/volume?period= */
export interface AnalyticsVolumeDto {
  period: AnalyticsPeriod;
  series: VolumeSeriesPointDto[];
}

/** GET /api/analytics/sentiment */
export interface AnalyticsSentimentDto {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  unclassified: number;
  percentages: {
    positive: number;
    negative: number;
    neutral: number;
    unclassified: number;
  };
}

export interface ThemeSentimentBreakdownDto {
  id: string;
  name: string;
  color: string;
  feedbackCount: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/** GET /api/analytics/themes — a plain array, not paginated. */
export type AnalyticsThemesDto = ThemeSentimentBreakdownDto[];

export interface TrendsSeriesPointDto {
  date: string; // YYYY-MM-DD
  positive: number;
  negative: number;
  neutral: number;
}

/** GET /api/analytics/trends?period= */
export interface AnalyticsTrendsDto {
  period: AnalyticsPeriod;
  series: TrendsSeriesPointDto[];
}

// ---------------------------------------------------------------------------
// Ask HermesX — POST /api/ask-hermesx
// ---------------------------------------------------------------------------

export interface AskHermesxSourceDto {
  feedbackId: string;
  content: string;
  sentiment: string | null;
  channel: string;
  createdAt: string;
  similarity: number;
}

export interface AskHermesxResponseDto {
  answer: string;
  confidence: Confidence;
  citedFeedbackIds: string[];
  sources: AskHermesxSourceDto[];
}

// ---------------------------------------------------------------------------
// Reports — /api/reports, /api/reports/:id
// ---------------------------------------------------------------------------

export interface ReportNarrativeDto {
  executiveSummary: string;
  feedbackOverview: string;
  sentimentAnalysis: string;
  topThemes: string;
  majorChanges: string;
  recommendedActions: string[];
}

export interface ReportTopThemeDto {
  id: string;
  name: string;
  color: string;
  count: number;
  percentage: number;
}

export interface ReportQuoteDto {
  content: string;
  sentiment: string;
  channel: string;
}

export interface ReportStatsDto {
  totalFeedback: number;
  positive: number;
  negative: number;
  neutral: number;
  topThemes: ReportTopThemeDto[];
  representativeQuotes: ReportQuoteDto[];
}

export interface ReportContentDto {
  narrative: ReportNarrativeDto;
  stats: ReportStatsDto;
}

/** The user who generated a report — joined via the Report.generatedByUser relation. */
export interface ReportGeneratedByUserDto {
  name: string;
  email: string;
}

/** Row shape returned by GET /api/reports (list) — narrower than the full report. */
export interface ReportSummaryDto {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  generatedBy: string;
  generatedByUser: ReportGeneratedByUserDto;
}

/** Full row shape returned by POST /api/reports and GET /api/reports/:id. */
export interface ReportDto extends ReportSummaryDto {
  workspaceId: string;
  contentJson: ReportContentDto;
}

// ---------------------------------------------------------------------------
// Health — GET /api/health
// ---------------------------------------------------------------------------

export interface HealthDto {
  status: string;
  database: string;
  timestamp: string;
}