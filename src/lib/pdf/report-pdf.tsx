import path from 'node:path';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
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
 * v2 design pass:
 *  - Registers "Inter" as the report typeface instead of built-in Helvetica.
 *  - Cover page is now a white page with a bordered frame + a brand accent
 *    bar, instead of the old dark full-bleed cover.
 *  - Every page gets a thin colored accent bar + a rule under the header,
 *    so the whole report reads as one designed system, not stacked cards.
 *  - "Report Information" lives on its own page (previously it could get
 *    sliced in half by react-pdf's automatic page-break when the
 *    Recommended Actions page overflowed).
 *  - Sparse/empty states (no themes, no quotes, no previous period) are
 *    boxed as proper empty-state cards instead of a lone line of text.
 *
 * FONT SETUP (required before this will render):
 *   1. Download Inter-Regular.ttf, Inter-Bold.ttf and Inter-Italic.ttf
 *      (e.g. from https://fonts.google.com/specimen/Inter).
 *   2. Place all three files in `public/fonts/` in this project.
 *   3. Font.register below reads them from disk at request time — nothing
 *      needs bundling — but if the files are missing, PDF generation will
 *      throw as soon as this module loads. Swap the family name/paths
 *      below if you'd rather use a different typeface.
 *
 * Uses `node:path` + `Font.register` from disk — this runs in a Node
 * server context, not a browser, so there's no `fetch`/network dependency
 * for the font at render time.
 */

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(FONTS_DIR, 'Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.join(FONTS_DIR, 'Inter-Bold.ttf'), fontWeight: 700 },
    {
      src: path.join(FONTS_DIR, 'Inter-Italic.ttf'),
      fontWeight: 400,
      fontStyle: 'italic',
    },
  ],
});

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
    fontFamily: 'Inter',
    color: COLORS.text,
  },

  // ── Accent bar shown at the very top of every content page ──
  pageAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLORS.primary,
  },

  // ── Cover page (Page 1) ──
  coverPage: {
    padding: 32,
    fontFamily: 'Inter',
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },

  coverFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },

  coverTopBar: {
    height: 8,
    backgroundColor: COLORS.primary,
  },

  coverBody: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 60,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },

  coverLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  coverLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  coverLogoBadgeText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontFamily: 'Inter',
    fontWeight: 700,
  },

  coverBrand: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 3,
  },

  coverTagline: {
    fontSize: 7.5,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },

  coverDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 40,
  },

  coverEyebrow: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.primaryDark,
    letterSpacing: 1.6,
    marginBottom: 14,
  },

  coverTitle: {
    fontSize: 27,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.25,
    marginBottom: 16,
    maxWidth: 420,
  },

  coverPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 48,
  },

  coverStatsRow: {
    flexDirection: 'row',
  },

  coverStatCard: {
    width: '31.5%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    backgroundColor: COLORS.surface,
    marginRight: 10,
  },

  coverStatCardLast: {
    width: '31.5%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    backgroundColor: COLORS.surface,
  },

  coverStatValue: {
    fontSize: 19,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.primaryDark,
    marginBottom: 4,
  },

  coverStatLabel: {
    fontSize: 6.8,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  coverMetaBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 18,
    paddingHorizontal: 48,
    backgroundColor: COLORS.surface,
  },

  coverMetaLine: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginBottom: 3,
  },

  // ── Shared page header/footer ──
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontFamily: 'Inter',
    fontWeight: 700,
  },

  pageHeaderBrand: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: 700,
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
    borderWidth: 1,
    borderColor: '#DDE3FB',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 6,
    padding: 18,
  },

  summaryBoxLabel: {
    fontSize: 8.5,
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  sectionCardTitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: 7,
  },

  insightCard: {
    borderRadius: 10,
    padding: 16,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#DDE3FB',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginTop: 16,
  },

  insightLabel: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  changeNarrativeCard: {
    marginTop: 4,
    borderRadius: 10,
    padding: 18,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#DDE3FB',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  changeNarrativeLabel: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  emptyStateCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 18,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },

  emptyStateTitle: {
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.textMuted,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
    color: COLORS.text,
  },

  comparisonDelta: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 700,
  },

  comparisonPrevious: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Inter',
    fontWeight: 700,
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
    fontFamily: 'Inter',
    fontWeight: 700,
    marginBottom: 2,
  },

  quoteText: {
    fontSize: 10.5,
    fontFamily: 'Inter',
    fontStyle: 'italic',
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
    fontFamily: 'Inter',
    fontWeight: 700,
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

function PageAccentBar() {
  return <View style={styles.pageAccentBar} fixed />;
}

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

      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageLabel} · Page ${pageNumber} of ${totalPages}`
        }
      />
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
            fontFamily: 'Inter',
            fontWeight: 700,
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
        <View style={styles.coverFrame}>
          <View style={styles.coverTopBar} />

          <View style={styles.coverBody}>
            <View style={styles.coverLogoRow}>
              <View style={styles.coverLogoBadge}>
                <Text style={styles.coverLogoBadgeText}>
                  H
                </Text>
              </View>

              <View>
                <Text style={styles.coverBrand}>
                  HermesX
                </Text>
                <Text style={styles.coverTagline}>
                  AI-POWERED CUSTOMER FEEDBACK INTELLIGENCE
                </Text>
              </View>
            </View>

            <View style={styles.coverDivider} />

            <Text style={styles.coverEyebrow}>
              CUSTOMER FEEDBACK REPORT
            </Text>

            <Text style={styles.coverTitle}>
              {data.title}
            </Text>

            <Text style={styles.coverPeriod}>
              {formatDate(data.periodStart)} —{' '}
              {formatDate(data.periodEnd)}
            </Text>

            <View style={styles.coverStatsRow}>
              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatValue}>
                  {stats.totalFeedback}
                </Text>
                <Text style={styles.coverStatLabel}>
                  FEEDBACK ITEMS
                </Text>
              </View>

              <View style={styles.coverStatCard}>
                <Text style={styles.coverStatValue}>
                  {stats.topThemes.length}
                </Text>
                <Text style={styles.coverStatLabel}>
                  THEMES TRACKED
                </Text>
              </View>

              <View style={styles.coverStatCardLast}>
                <Text style={styles.coverStatValue}>
                  {analyzedPercentage}%
                </Text>
                <Text style={styles.coverStatLabel}>
                  ANALYZED
                </Text>
              </View>
            </View>
          </View>

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
        </View>
      </Page>

      {/* Page 2 — Executive Summary */}

      <Page
        size="A4"
        style={styles.page}
      >
        <PageAccentBar />
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
        <PageAccentBar />
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
                borderColor: COLORS.border,
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
        <PageAccentBar />
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
        <PageAccentBar />
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
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              NO THEMES YET
            </Text>
            <Text style={styles.paragraph}>
              No themes were recorded for this period.
            </Text>
          </View>
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
        <PageAccentBar />
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
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              NO PRIOR PERIOD TO COMPARE
            </Text>
            <Text style={styles.paragraph}>
              No feedback was recorded in the immediately
              preceding period, so a numeric comparison is
              not available.
            </Text>
          </View>
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
        <PageAccentBar />
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
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              NO NEGATIVE QUOTES
            </Text>
            <Text style={styles.paragraph}>
              No negative quotes were available for this period.
            </Text>
          </View>
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
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              NO POSITIVE QUOTES
            </Text>
            <Text style={styles.paragraph}>
              No positive quotes were available for this period.
            </Text>
          </View>
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

      {/* Page 8 — Recommended Actions */}

      <Page size="A4" style={styles.page}>
        <PageAccentBar />
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

        <Footer pageLabel="Recommended Actions" />
      </Page>

      {/* Page 9 — Report Information */}

      <Page size="A4" style={styles.page}>
        <PageAccentBar />
        <PageHeader label="Report Information" />

        <Text style={styles.sectionTitle}>
          Report Information
        </Text>

        <Text style={styles.introText}>
          Summary details and methodology behind this report.
        </Text>

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
            <Text style={[styles.miniMetricValue, { color: COLORS.positive }]}>
              {stats.positive}
            </Text>
            <Text style={styles.miniMetricLabel}>
              POSITIVE
            </Text>
          </View>

          <View style={styles.miniMetricCardLast}>
            <Text style={[styles.miniMetricValue, { color: COLORS.negative }]}>
              {stats.negative}
            </Text>
            <Text style={styles.miniMetricLabel}>
              NEGATIVE
            </Text>
          </View>
        </View>

        <View style={styles.reportInfoCard}>
          <Text
            style={[
              styles.sectionHeading,
              { color: COLORS.textMuted, marginBottom: 8 },
            ]}
          >
            REPORT DETAILS
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

        <View style={styles.themeSummaryCard}>
          <Text style={styles.themeSummaryLabel}>
            HOW THIS REPORT WAS GENERATED
          </Text>
          <Text style={styles.paragraph}>
            Every piece of feedback collected during the report period is
            automatically classified by sentiment and grouped into themes.
            The executive summary, sentiment interpretation, thematic
            insights, and recommended actions in this report are generated
            directly from those classifications and the underlying feedback
            text — no figures shown are estimated or manually adjusted.
          </Text>
        </View>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 8.5,
              color: COLORS.textMuted,
              textAlign: 'center',
            }}
          >
            Questions about this report? Reach out to your workspace admin.
          </Text>
        </View>

        <Footer pageLabel="Report Information" />
      </Page>
    </Document>
  );
}