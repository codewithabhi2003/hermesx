import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/db/prisma';
import { upsertFeedbackEmbeddingsBatch } from '../src/lib/embeddings/cohere';

/**
 * Demo data seed script.
 *
 * Sentiment, scores, feature areas, and theme assignments below are
 * DETERMINISTIC and hand-written — they deliberately do NOT call Groq, so
 * `npm run prisma:seed` works without incurring AI provider cost or
 * requiring the classification pipeline to be correct yet. Embeddings ARE
 * generated for real via Cohere (best-effort — seeding still completes if
 * that call fails) so Ask HermesX has something to retrieve against
 * immediately after seeding.
 */

const SALT_ROUNDS = 12;
const DEMO_PASSWORD = 'Password123!';

const THEME_DEFINITIONS = [
  { name: 'Onboarding', color: '#6366F1', description: 'First-run experience and account setup' },
  { name: 'Billing', color: '#F59E0B', description: 'Payments, invoicing, and plan changes' },
  { name: 'Performance', color: '#EF4444', description: 'Speed, crashes, and reliability' },
  { name: 'Customer Support', color: '#10B981', description: 'Support responsiveness and quality' },
  { name: 'Feature Requests', color: '#3B82F6', description: 'Requests for new or improved functionality' },
] as const;

interface SeedFeedback {
  content: string;
  channel: 'SUPPORT' | 'APP_STORE' | 'SURVEY' | 'SALES' | 'SOCIAL' | 'MANUAL';
  customerLabel: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number;
  featureArea: string;
  aiRationale: string;
  themeNames: string[];
}

const SEED_FEEDBACK: SeedFeedback[] = [
  {
    content: 'The signup flow took less than two minutes and I was up and running immediately. Great first impression.',
    channel: 'SURVEY',
    customerLabel: 'new_user_884',
    sentiment: 'POSITIVE',
    sentimentScore: 0.8,
    featureArea: 'Onboarding',
    aiRationale: 'Customer praises the speed and simplicity of account setup.',
    themeNames: ['Onboarding'],
  },
  {
    content: "I got charged twice for my subscription this month and support hasn't responded in four days.",
    channel: 'SUPPORT',
    customerLabel: 'billing_frustrated_12',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.9,
    featureArea: 'Billing',
    aiRationale: 'Duplicate charge combined with slow support response drives strong negative sentiment.',
    themeNames: ['Billing', 'Customer Support'],
  },
  {
    content: 'App crashes constantly when I try to upload more than a few photos at once.',
    channel: 'APP_STORE',
    customerLabel: 'mobile_user_77',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.75,
    featureArea: 'Performance',
    aiRationale: 'Repeated crashes during bulk uploads indicate a reliability issue.',
    themeNames: ['Performance'],
  },
  {
    content: 'Support resolved my login issue in under ten minutes over chat. Really impressed.',
    channel: 'SUPPORT',
    customerLabel: 'happy_client_5',
    sentiment: 'POSITIVE',
    sentimentScore: 0.85,
    featureArea: 'Customer Support',
    aiRationale: 'Fast, effective support resolution generates strong positive sentiment.',
    themeNames: ['Customer Support'],
  },
  {
    content: 'Would love to see a dark mode option, staring at the bright dashboard all day is rough on the eyes.',
    channel: 'SURVEY',
    customerLabel: 'daily_user_203',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.1,
    featureArea: 'UI/UX',
    aiRationale: 'A constructive feature request without strong positive or negative charge.',
    themeNames: ['Feature Requests'],
  },
  {
    content: 'Renewal pricing jumped 40% with zero notice. Considering switching providers.',
    channel: 'SALES',
    customerLabel: 'enterprise_acct_9',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.85,
    featureArea: 'Billing',
    aiRationale: 'Unexpected large price increase without notice is a strong churn signal.',
    themeNames: ['Billing'],
  },
  {
    content: 'Dashboard loads noticeably faster since the last update. Nice work on performance.',
    channel: 'APP_STORE',
    customerLabel: 'power_user_61',
    sentiment: 'POSITIVE',
    sentimentScore: 0.7,
    featureArea: 'Performance',
    aiRationale: 'Customer explicitly credits a recent update with improved load times.',
    themeNames: ['Performance'],
  },
  {
    content: 'It took me a while to figure out where to invite my teammates, the setup wizard skips over it.',
    channel: 'SURVEY',
    customerLabel: 'team_admin_14',
    sentiment: 'NEUTRAL',
    sentimentScore: -0.15,
    featureArea: 'Onboarding',
    aiRationale: 'Mild friction during setup, not severe enough to be strongly negative.',
    themeNames: ['Onboarding'],
  },
  {
    content: "Could you add bulk export to CSV? Doing it one record at a time is painful for our workflow.",
    channel: 'SOCIAL',
    customerLabel: 'ops_team_lead',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.05,
    featureArea: 'Exports',
    aiRationale: 'A specific, actionable feature request stated neutrally.',
    themeNames: ['Feature Requests'],
  },
  {
    content: 'Been a customer for two years and the product keeps getting better. The team clearly listens to feedback.',
    channel: 'SOCIAL',
    customerLabel: 'longtime_fan',
    sentiment: 'POSITIVE',
    sentimentScore: 0.9,
    featureArea: 'General',
    aiRationale: 'Long-tenure customer expresses strong loyalty and satisfaction with product direction.',
    themeNames: ['Feature Requests', 'Customer Support'],
  },
];

async function main() {
  const existingWorkspace = await prisma.workspace.findFirst();
  if (existingWorkspace) {
    // eslint-disable-next-line no-console
    console.log('A workspace already exists — skipping seed to avoid creating duplicate demo data.');
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const workspace = await prisma.workspace.create({
    data: { name: 'HermesX Demo' },
  });

  await prisma.user.createMany({
    data: [
      { name: 'Demo Admin', email: 'admin@hermesx.dev', passwordHash, role: 'ADMIN', workspaceId: workspace.id },
      { name: 'Demo Analyst', email: 'analyst@hermesx.dev', passwordHash, role: 'ANALYST', workspaceId: workspace.id },
      { name: 'Demo Viewer', email: 'viewer@hermesx.dev', passwordHash, role: 'VIEWER', workspaceId: workspace.id },
    ],
  });

  const themesByName = new Map<string, string>();
  for (const themeDef of THEME_DEFINITIONS) {
    const theme = await prisma.theme.create({
      data: {
        workspaceId: workspace.id,
        name: themeDef.name,
        color: themeDef.color,
        description: themeDef.description,
      },
    });
    themesByName.set(theme.name, theme.id);
  }

  const createdFeedback: { feedbackId: string; content: string }[] = [];

  for (const item of SEED_FEEDBACK) {
    const feedback = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        customerLabel: item.customerLabel,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        featureArea: item.featureArea,
        aiRationale: item.aiRationale,
        aiAnalyzed: true,
        classifiedAt: new Date(),
        status: 'NEW',
        workspaceId: workspace.id,
      },
    });

    for (const themeName of item.themeNames) {
      const themeId = themesByName.get(themeName);
      if (!themeId) continue;
      await prisma.feedbackTheme.create({
        data: { feedbackId: feedback.id, themeId, confidence: 0.9 },
      });
    }

    createdFeedback.push({ feedbackId: feedback.id, content: feedback.content });
  }

  try {
    await upsertFeedbackEmbeddingsBatch(createdFeedback);
    // eslint-disable-next-line no-console
    console.log(`Generated embeddings for ${createdFeedback.length} seeded feedback rows.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      'Skipping embeddings — Cohere call failed during seed (this is non-fatal):',
      error instanceof Error ? error.message : String(error)
    );
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  // eslint-disable-next-line no-console
  console.log(`Workspace: ${workspace.name} (${workspace.id})`);
  // eslint-disable-next-line no-console
  console.log(`Demo login password for all seeded users: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
