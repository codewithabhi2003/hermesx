import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReportContentDto } from '@/types';

/**
 * Renders a real, multi-page PDF — not a screenshot of the web page.
 * Every number and quote here comes directly from `report.contentJson`,
 * computed from PostgreSQL at report-generation time (see
 * lib/ai/report-narrative.ts and the reports POST route). Nothing is
 * invented at render time — there's no "AI Insights" page here because
 * that field doesn't exist in the stored narrative, and the "Major
 * Changes" comparison cards use the REAL previous-period counts computed
 * at generation time, not estimated or fabricated deltas.
 *
 * Backward compatibility: `unclassified` and `previousPeriod` were added
 * to the stats shape after some reports were already generated — both are
 * read defensively (`?? 0` / `?? null`) so older reports render fine
 * without those fields rather than crashing.
 *
 * Uses the built-in Helvetica font (no custom font registration) — this
 * runs in a Node server context, not a browser, so the app's web font
 * isn't available here without extra setup not worth it for this feature.
 */

const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primarySoft: '#EEF2FF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  positive: '#10B981',
  positiveSoft: '#ECFDF5',
  negative: '#EF4444',
  negativeSoft: '#FEF2F2',
  neutral: '#F59E0B',
  neutralSoft: '#FFFBEB',
  surface: '#F8FAFC',
  pending: '#CBD5E1',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.text,
  },

  coverPage: {
    padding: 48,
    fontFamily: 'Helvetica',
    color: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B14',
  },

  coverLogoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  coverLogoBadgeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
  },

  coverBrand: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },

  coverTagline: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginBottom: 56,
    letterSpacing: 0.5,
  },

  coverTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 400,
  },

  coverPeriod: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 70,
  },

  coverMetaBlock: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 18,
    alignItems: 'center',
  },

  coverMetaLine: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 3,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  pageHeaderBadge: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  pageHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },

  pageHeaderBrand: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 18,
    color: COLORS.text,
  },

  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.65,
    color: COLORS.textSecondary,
  },

  summaryBox: {
    backgroundColor: COLORS.primarySoft,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 6,
    padding: 18,
  },

  summaryBoxLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  summaryBoxText: {
    fontSize: 11,
    lineHeight: 1.65,
    color: COLORS.text,
  },

  introText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },

  sectionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },

  sectionCardLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  sectionCardTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 7,
  },

  insightCard: {
    borderRadius: 10,
    padding: 16,
    backgroundColor: COLORS.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginTop: 16,
  },

  insightLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  insightText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.text,
  },

  miniMetricRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 4,
  },

  miniMetricCard: {
    width: '31.5%',
    minHeight: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 12,
    backgroundColor: COLORS.surface,
    marginRight: 10,
  },

  miniMetricCardLast: {
    width: '31.5%',
    minHeight: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 12,
    backgroundColor: COLORS.surface,
  },

  miniMetricValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },

  miniMetricLabel: {
    fontSize: 7.5,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  sentimentPanel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },

  sentimentTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },

  sentimentSubtitle: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginBottom: 16,
  },

  themeSummaryCard: {
    marginTop: 10,
    borderRadius: 10,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  themeSummaryLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  changeNarrativeCard: {
    marginTop: 4,
    borderRadius: 10,
    padding: 18,
    backgroundColor: COLORS.primarySoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  changeNarrativeLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  quoteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  quoteCardHalf: {
    width: '48%',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quoteCardFull: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionIntro: {
    fontSize: 10,
    lineHeight: 1.55,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },

  voiceSectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.7,
    marginBottom: 9,
  },

  voiceSummaryCard: {
    borderRadius: 10,
    padding: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  voiceSummaryText: {
    fontSize: 9.7,
    lineHeight: 1.55,
    color: COLORS.textSecondary,
  },

  voiceTakeawayCard: {
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 2,
  },

  voiceTakeawayText: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: COLORS.textSecondary,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  actionCardHalf: {
    width: '48%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 11,
    marginBottom: 9,
    backgroundColor: '#FFFFFF',
  },

  actionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  actionPriority: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },

  actionCardText: {
    fontSize: 9.3,
    lineHeight: 1.45,
    color: COLORS.text,
  },

  actionContextCard: {
    borderRadius: 10,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 3,
    marginBottom: 12,
  },

  actionContextLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  actionContextText: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: COLORS.textSecondary,
  },

  actionMetricRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  actionMetricCard: {
    width: '31.5%',
    minHeight: 58,
    borderRadius: 9,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },

  actionMetricCardLast: {
    width: '31.5%',
    minHeight: 58,
    borderRadius: 9,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionMetricValue: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 3,
  },

  actionMetricLabel: {
    fontSize: 7.2,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  reportInfoCard: {
    marginTop: 20,
    borderRadius: 10,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },

  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },

  metricValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },

  metricLabel: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginBottom: 8,
  },

  donutCenterValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
  },

  donutCenterLabel: {
    fontSize: 7,
    color: COLORS.textMuted,
  },

  legendColumn: {
    flex: 1,
    gap: 10,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  legendSwatchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 2.5,
  },

  legendLabel: {
    fontSize: 10,
    color: COLORS.text,
  },

  legendValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
  },

  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  themeRank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  themeRankText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.textSecondary,
  },

  themeBody: {
    flex: 1,
  },

  themeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  themeName: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
  },

  themeValue: {
    fontSize: 9.5,
    color: COLORS.textMuted,
  },

  barTrack: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },

  barFill: {
    height: 7,
    borderRadius: 3.5,
  },

  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  comparisonCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },

  comparisonLabel: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginBottom: 6,
  },

  comparisonValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },

  comparisonValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
  },

  comparisonDelta: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },

  comparisonPrevious: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  quoteCard: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },

  quoteMark: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },

  quoteText: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Oblique',
    color: COLORS.text,
    lineHeight: 1.5,
    marginBottom: 6,
  },

  quoteMeta: {
    fontSize: 8,
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  recommendationCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },

  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 6,
    marginRight: 12,
  },

  recommendationText: {
    flex: 1,
    fontSize: 10.5,
    color: COLORS.text,
    lineHeight: 1.55,
    paddingTop: 4,
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: COLORS.textMuted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
});

function PageHeader({ label }: { label: string }) {
  return (
    <View style={styles.pageHeader} fixed>
      <View style={styles.pageHeaderBadge}>
        <Text style={styles.pageHeaderBadgeText}>H</Text>
      </View>

      <Text style={styles.pageHeaderBrand}>
        HERMESX · {label.toUpperCase()}
      </Text>
    </View>
  );
}

function Footer({ pageLabel }: { pageLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        HermesX — AI-Powered Customer Feedback Intelligence
      </Text>

      <Text render={({ pageNumber }) => `${pageLabel} · Page ${pageNumber}`} />
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Sentiment visualization built ENTIRELY from plain Views.
 *
 * This deliberately does not use react-pdf's Svg/Circle/Path
 * primitives because SVG stroke/dash rendering caused the
 * pdfkit error:
 *
 * "dash([null], {}) invalid"
 *
 * A proportional stacked bar is safer for the current
 * react-pdf/pdfkit environment.
 */
function SentimentBar({
  segments,
  total,
}: {
  segments: DonutSegment[];
  total: number;
}) {
  const visible = segments.filter((segment) => segment.value > 0);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Helvetica-Bold',
            color: COLORS.text,
          }}
        >
          {total}
        </Text>

        <Text
          style={{
            fontSize: 9,
            color: COLORS.textMuted,
            marginLeft: 6,
          }}
        >
          total feedback
        </Text>
      </View>

      {visible.length === 0 ? (
        <View
          style={{
            height: 28,
            borderRadius: 6,
            backgroundColor: COLORS.border,
          }}
        />
      ) : (
        <View
          style={{
            flexDirection: 'row',
            height: 28,
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {visible.map((segment, i) => (
            <View
              key={`${segment.label}-${i}`}
              style={{
                flex: segment.value,
                backgroundColor: segment.color,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function computeDelta(
  current: number,
  previous: number,
): {
  pctLabel: string;
  direction: 'up' | 'down' | 'flat';
} {
  if (previous === 0) {
    if (current === 0) {
      return {
        pctLabel: '—',
        direction: 'flat',
      };
    }

    return {
      pctLabel: 'New',
      direction: 'up',
    };
  }

  const pct =
    Math.round(((current - previous) / previous) * 1000) / 10;

  if (pct === 0) {
    return {
      pctLabel: '0%',
      direction: 'flat',
    };
  }

  return {
    pctLabel: `${pct > 0 ? '+' : ''}${pct}%`,
    direction: pct > 0 ? 'up' : 'down',
  };
}

function ComparisonCard({
  label,
  current,
  previous,
  goodDirection,
}: {
  label: string;
  current: number;
  previous: number;
  /**
   * Which direction counts as "good" for this metric.
   *
   * 'neutral' never colors the delta red/green.
   */
  goodDirection: 'up' | 'down' | 'neutral';
}) {
  const { pctLabel, direction } = computeDelta(
    current,
    previous,
  );

  const isGood =
    goodDirection === 'neutral'
      ? null
      : direction === goodDirection
        ? true
        : direction === 'flat'
          ? null
          : false;

  const deltaColor =
    isGood === null
      ? COLORS.textMuted
      : isGood
        ? COLORS.positive
        : COLORS.negative;

const arrow =
  direction === 'up'
    ? '+'
    : direction === 'down'
      ? '-'
      : '';

  const deltaText =
    pctLabel === 'New'
      ? 'New'
      : `${arrow}${pctLabel}`;

  return (
    <View style={styles.comparisonCard}>
      <Text style={styles.comparisonLabel}>
        {label}
      </Text>

      <View style={styles.comparisonValueRow}>
        <Text style={styles.comparisonValue}>
          {current}
        </Text>

        <Text
          style={[
            styles.comparisonDelta,
            { color: deltaColor },
          ]}
        >
          {deltaText}
        </Text>
      </View>

      <Text style={styles.comparisonPrevious}>
        Previous period: {previous}
      </Text>
    </View>
  );
}

export interface ReportPdfData {
  workspaceName: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  generatedByName: string;
  content: ReportContentDto;
}

export function ReportPdfDocument({
  data,
}: {
  data: ReportPdfData;
}) {
  const { stats, narrative } = data.content;

  const unclassified = stats.unclassified ?? 0;
  const previousPeriod = stats.previousPeriod ?? null;
  const analyzedCount = Math.max(stats.totalFeedback - unclassified, 0);
  const analyzedPercentage =
    stats.totalFeedback > 0
      ? Math.round((analyzedCount / stats.totalFeedback) * 100)
      : 0;

  const negativeQuotes = Array.from(
  new Map(
    stats.representativeQuotes
      .filter((q) => q.sentiment === 'NEGATIVE')
      .map((q) => [q.content, q]),
  ).values(),
).slice(0, 2);

const positiveQuotes = Array.from(
  new Map(
    stats.representativeQuotes
      .filter((quote) => quote.sentiment === 'POSITIVE')
      .map((quote) => [quote.content, quote]),
  ).values(),
).slice(0, 2);

  const donutSegments: DonutSegment[] = [
    {
      label: 'Positive',
      value: stats.positive,
      color: COLORS.positive,
    },
    {
      label: 'Neutral',
      value: stats.neutral,
      color: COLORS.neutral,
    },
    {
      label: 'Negative',
      value: stats.negative,
      color: COLORS.negative,
    },
    {
      label: 'Pending analysis',
      value: unclassified,
      color: COLORS.pending,
    },
  ];

  return (
    <Document
      title={data.title}
      author="HermesX"
    >
      {/* Page 1 — Cover */}

      <Page
        size="A4"
        style={styles.coverPage}
      >
        <View style={styles.coverLogoBadge}>
          <Text style={styles.coverLogoBadgeText}>
            H
          </Text>
        </View>

        <Text style={styles.coverBrand}>
          HermesX
        </Text>

        <Text style={styles.coverTagline}>
          AI-POWERED CUSTOMER FEEDBACK INTELLIGENCE
        </Text>

        <Text style={styles.coverTitle}>
          {data.title}
        </Text>

        <Text style={styles.coverPeriod}>
          {formatDate(data.periodStart)} —{' '}
          {formatDate(data.periodEnd)}
        </Text>

        <View style={styles.coverMetaBlock}>
          <Text style={styles.coverMetaLine}>
            PREPARED FOR{' '}
            {data.workspaceName.toUpperCase()}
          </Text>

          <Text style={styles.coverMetaLine}>
            Generated {formatDate(data.createdAt)} by{' '}
            {data.generatedByName}
          </Text>
        </View>
      </Page>

      {/* Page 2 — Executive Summary */}

      <Page
        size="A4"
        style={styles.page}
      >
        <PageHeader label="Executive Summary" />

        <Text style={styles.sectionTitle}>
          Executive Summary
        </Text>

        <Text style={styles.introText}>
          A concise view of the customer feedback collected during this reporting period.
        </Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryBoxLabel}>
            AI-GENERATED OVERVIEW
          </Text>

          <Text style={styles.summaryBoxText}>
            {narrative.executiveSummary}
          </Text>
        </View>

        <View style={styles.miniMetricRow}>
          <View style={styles.miniMetricCard}>
            <Text style={styles.miniMetricValue}>
              {stats.totalFeedback}
            </Text>
            <Text style={styles.miniMetricLabel}>
              TOTAL FEEDBACK
            </Text>
          </View>

          <View style={styles.miniMetricCard}>
            <Text
              style={[
                styles.miniMetricValue,
                { color: COLORS.primary },
              ]}
            >
              {analyzedCount}
            </Text>
            <Text style={styles.miniMetricLabel}>
              ANALYZED
            </Text>
          </View>

          <View style={styles.miniMetricCardLast}>
            <Text
              style={[
                styles.miniMetricValue,
                { color: COLORS.textMuted },
              ]}
            >
              {analyzedPercentage}%
            </Text>
            <Text style={styles.miniMetricLabel}>
              ANALYSIS COVERAGE
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>
            REPORT PERIOD
          </Text>
          <Text style={styles.insightText}>
            {formatDate(data.periodStart)} — {formatDate(data.periodEnd)}
          </Text>
        </View>

        <Footer pageLabel="Executive Summary" />
      </Page>

      {/* Page 3 — Feedback Overview */}

      <Page
        size="A4"
        style={styles.page}
      >
        <PageHeader label="Feedback Overview" />

        <Text style={styles.sectionTitle}>
          Feedback Overview
        </Text>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {stats.totalFeedback}
            </Text>

            <Text style={styles.metricLabel}>
              TOTAL FEEDBACK
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text
              style={[
                styles.metricValue,
                { color: COLORS.positive },
              ]}
            >
              {stats.positive}
            </Text>

            <Text style={styles.metricLabel}>
              POSITIVE
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text
              style={[
                styles.metricValue,
                { color: COLORS.neutral },
              ]}
            >
              {stats.neutral}
            </Text>

            <Text style={styles.metricLabel}>
              NEUTRAL
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text
              style={[
                styles.metricValue,
                { color: COLORS.negative },
              ]}
            >
              {stats.negative}
            </Text>

            <Text style={styles.metricLabel}>
              NEGATIVE
            </Text>
          </View>
        </View>

        {unclassified > 0 && (
          <View
            style={[
              styles.summaryBox,
              {
                backgroundColor: COLORS.surface,
                borderLeftColor: COLORS.pending,
                marginBottom: 20,
              },
            ]}
          >
            <Text
              style={[
                styles.summaryBoxText,
                { fontSize: 9.5 },
              ]}
            >
              {unclassified} of {stats.totalFeedback}{' '}
              feedback items from this period had not yet
              been AI-classified at the time this report was
              generated, and are excluded from the
              sentiment/theme figures above.
            </Text>
          </View>
        )}

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>
            PERIOD INSIGHT
          </Text>
          <Text style={styles.insightText}>
            {narrative.feedbackOverview}
          </Text>
        </View>

        <Footer pageLabel="Feedback Overview" />
      </Page>

      {/* Page 4 — Sentiment Analysis */}

      <Page
        size="A4"
        style={styles.page}
      >
        <PageHeader label="Sentiment Analysis" />

        <Text style={styles.sectionTitle}>
          Sentiment Analysis
        </Text>

        <View style={styles.sentimentPanel}>
          <Text style={styles.sentimentTitle}>
            Sentiment distribution
          </Text>
          <Text style={styles.sentimentSubtitle}>
            Classified feedback compared with items still awaiting analysis.
          </Text>

          <View style={styles.donutRow}>
            <SentimentBar
              segments={donutSegments}
              total={stats.totalFeedback}
            />

            <View style={styles.legendColumn}>
              {donutSegments
                .filter((segment) => segment.value > 0)
                .map((segment) => (
                  <View
                    key={segment.label}
                    style={styles.legendRow}
                  >
                    <View style={styles.legendSwatchLabel}>
                      <View
                        style={[
                          styles.legendSwatch,
                          {
                            backgroundColor:
                              segment.color,
                          },
                        ]}
                      />

                      <Text style={styles.legendLabel}>
                        {segment.label}
                      </Text>
                    </View>

                    <Text style={styles.legendValue}>
                      {segment.value} (
                      {stats.totalFeedback > 0
                        ? Math.round(
                            (segment.value /
                              stats.totalFeedback) *
                              1000,
                          ) / 10
                        : 0}
                      %)
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>
            AI SENTIMENT INTERPRETATION
          </Text>
          <Text style={styles.insightText}>
            {narrative.sentimentAnalysis}
          </Text>
        </View>

        <Footer pageLabel="Sentiment Analysis" />
      </Page>

      {/* Page 5 — Top Themes */}

      <Page
        size="A4"
        style={styles.page}
      >
        <PageHeader label="Top Themes" />

        <Text style={styles.sectionTitle}>
          Top Customer Themes
        </Text>

        {stats.topThemes.length > 0 ? (
          stats.topThemes.map((theme, i) => (
            <View
              key={theme.id}
              style={styles.themeCard}
            >
              <View style={styles.themeRank}>
                <Text style={styles.themeRankText}>
                  {i + 1}
                </Text>
              </View>

              <View style={styles.themeBody}>
                <View style={styles.themeLabelRow}>
                  <Text style={styles.themeName}>
                    {theme.name}
                  </Text>

                  <Text style={styles.themeValue}>
                    {theme.count} · {theme.percentage}%
                  </Text>
                </View>

                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(
                          theme.percentage,
                          2,
                        )}%`,
                        backgroundColor: theme.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.paragraph}>
            No themes were recorded for this period.
          </Text>
        )}

        <View style={styles.themeSummaryCard}>
          <Text style={styles.themeSummaryLabel}>
            THEME SUMMARY
          </Text>
          <Text style={styles.paragraph}>
            {narrative.topThemes}
          </Text>
        </View>

        <Footer pageLabel="Top Themes" />
      </Page>

      {/* Page 6 — Major Changes */}

      <Page
        size="A4"
        style={styles.page}
      >
        <PageHeader label="Major Changes" />

        <Text style={styles.sectionTitle}>
          Major Changes
        </Text>

        {previousPeriod ? (
          <View style={styles.comparisonGrid}>
            <ComparisonCard
              label="TOTAL FEEDBACK"
              current={stats.totalFeedback}
              previous={previousPeriod.totalFeedback}
              goodDirection="neutral"
            />

            <ComparisonCard
              label="POSITIVE"
              current={stats.positive}
              previous={previousPeriod.positive}
              goodDirection="up"
            />

            <ComparisonCard
              label="NEGATIVE"
              current={stats.negative}
              previous={previousPeriod.negative}
              goodDirection="down"
            />

            <ComparisonCard
              label="NEUTRAL"
              current={stats.neutral}
              previous={previousPeriod.neutral}
              goodDirection="neutral"
            />
          </View>
        ) : (
          <Text
            style={[
              styles.paragraph,
              { marginBottom: 16 },
            ]}
          >
            No feedback was recorded in the immediately
            preceding period, so a numeric comparison isn't
            available.
          </Text>
        )}

        <View style={styles.changeNarrativeCard}>
          <Text style={styles.changeNarrativeLabel}>
            WHAT CHANGED
          </Text>
          <Text style={styles.paragraph}>
            {narrative.majorChanges}
          </Text>
        </View>

        <Footer pageLabel="Major Changes" />
      </Page>

      {/* Page 7 — Voice of Customer */}

      <Page size="A4" style={styles.page}>
        <PageHeader label="Voice of Customer" />

        <Text style={styles.sectionTitle}>
          Voice of Customer
        </Text>

        <View style={styles.voiceSummaryCard}>
          <Text style={styles.voiceSectionTitle}>
            AI CUSTOMER VOICE INTERPRETATION
          </Text>
          <Text style={styles.voiceSummaryText}>
            {narrative.feedbackOverview}
          </Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text
            style={[
              styles.sectionHeading,
              { color: COLORS.negative },
            ]}
          >
            NEGATIVE FEEDBACK
          </Text>
        </View>

        {negativeQuotes.length > 0 ? (
          <View style={styles.quoteGrid}>
            {negativeQuotes.map((quote, i) => (
              <View
                key={i}
                style={[
                  styles.quoteCardHalf,
                  {
                    backgroundColor: COLORS.negativeSoft,
                    borderColor: '#FECACA',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quoteMark,
                    { color: COLORS.negative },
                  ]}
                >
                  &ldquo;
                </Text>

                <Text style={styles.quoteText}>
                  {quote.content}
                </Text>

                <Text style={styles.quoteMeta}>
                  VIA {quote.channel.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={[
              styles.paragraph,
              { marginBottom: 12 },
            ]}
          >
            No negative quotes were available for this period.
          </Text>
        )}

        <View style={{ marginTop: 4, marginBottom: 8 }}>
          <Text
            style={[
              styles.sectionHeading,
              { color: COLORS.positive },
            ]}
          >
            POSITIVE FEEDBACK
          </Text>
        </View>

        {positiveQuotes.length > 0 ? (
          <View style={styles.quoteGrid}>
            {positiveQuotes.map((quote, i) => (
              <View
                key={i}
                style={[
                  styles.quoteCardHalf,
                  {
                    backgroundColor: COLORS.positiveSoft,
                    borderColor: '#A7F3D0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quoteMark,
                    { color: COLORS.positive },
                  ]}
                >
                  &ldquo;
                </Text>

                <Text style={styles.quoteText}>
                  {quote.content}
                </Text>

                <Text style={styles.quoteMeta}>
                  VIA {quote.channel.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.paragraph}>
            No positive quotes were available for this period.
          </Text>
        )}

        <View style={styles.voiceTakeawayCard}>
          <Text
            style={[
              styles.voiceSectionTitle,
              { color: COLORS.primaryDark },
            ]}
          >
            WHAT THIS SIGNALS
          </Text>
          <Text style={styles.voiceTakeawayText}>
            {narrative.sentimentAnalysis}
          </Text>
        </View>

        <Footer pageLabel="Voice of Customer" />
      </Page>

      {/* Page 8 — Recommended Actions + Report Information */}

      <Page size="A4" style={styles.page}>
        <PageHeader label="Recommended Actions" />

        <Text style={styles.sectionTitle}>
          Recommended Actions
        </Text>

        <Text style={styles.actionIntro}>
          Prioritized actions derived from the feedback themes, sentiment,
          customer voice, and changes observed during this reporting period.
        </Text>

        <View style={styles.actionMetricRow}>
          <View style={styles.actionMetricCard}>
            <Text style={[styles.actionMetricValue, { color: COLORS.negative }]}>
              {stats.negative}
            </Text>
            <Text style={styles.actionMetricLabel}>
              NEGATIVE SIGNALS
            </Text>
          </View>

          <View style={styles.actionMetricCard}>
            <Text style={[styles.actionMetricValue, { color: COLORS.positive }]}>
              {stats.positive}
            </Text>
            <Text style={styles.actionMetricLabel}>
              POSITIVE SIGNALS
            </Text>
          </View>

          <View style={styles.actionMetricCardLast}>
            <Text style={styles.actionMetricValue}>
              {stats.topThemes.length}
            </Text>
            <Text style={styles.actionMetricLabel}>
              TOP THEMES TRACKED
            </Text>
          </View>
        </View>

        <View style={styles.actionContextCard}>
          <Text style={styles.actionContextLabel}>
            AI PRIORITY CONTEXT
          </Text>
          <Text style={styles.actionContextText}>
            {narrative.majorChanges}
          </Text>
        </View>

        <View style={styles.actionGrid}>
          {narrative.recommendedActions.map((action, i) => (
            <View
              key={i}
              style={
                i % 2 === 1
                  ? [styles.actionCardHalf, { marginLeft: '4%' }]
                  : styles.actionCardHalf
              }
            >
              <View style={styles.actionTopRow}>
                <Text style={styles.recommendationNumber}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.actionPriority}>
                  ACTION
                </Text>
              </View>

              <Text style={styles.actionCardText}>
                {action}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.reportInfoCard}>
          <Text
            style={[
              styles.sectionHeading,
              {
                color: COLORS.textMuted,
                marginBottom: 8,
              },
            ]}
          >
            REPORT INFORMATION
          </Text>

          <Text style={styles.quoteMeta}>
            Workspace: {data.workspaceName}
          </Text>

          <Text style={styles.quoteMeta}>
            Period: {formatDate(data.periodStart)} – {formatDate(data.periodEnd)}
          </Text>

          <Text style={styles.quoteMeta}>
            Feedback analyzed: {stats.totalFeedback - unclassified} of {stats.totalFeedback}
          </Text>

          <Text style={styles.quoteMeta}>
            Generated: {formatDate(data.createdAt)} by {data.generatedByName}
          </Text>
        </View>

        <Footer pageLabel="Recommended Actions" />
      </Page>
    </Document>
  );
}