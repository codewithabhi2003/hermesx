import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/db/prisma';
import { upsertFeedbackEmbeddingsBatch } from '../src/lib/embeddings/cohere';

/**
 * HermesX demo seed.
 *
 * Creates:
 * - 1 demo workspace
 * - ADMIN / ANALYST / VIEWER demo users
 * - 5 themes
 * - exactly 89 feedback records from 2026-08-10 through 2026-09-09
 * - real Cohere embeddings (best-effort)
 *
 * The feedback volume is intentionally uneven by day so the dashboard
 * trend has natural peaks and dips instead of a flat line.
 *
 * Existing HermesX Demo feedback/themes are replaced. Other workspaces
 * are left untouched.
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

type Channel = 'SUPPORT' | 'APP_STORE' | 'SURVEY' | 'SALES' | 'SOCIAL' | 'MANUAL';
type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

interface FeedbackBlueprint {
  content: string;
  channel: Channel;
  sentiment: Sentiment;
  sentimentScore: number;
  featureArea: string;
  aiRationale: string;
  themeNames: string[];
}

const FEEDBACK_BLUEPRINTS: FeedbackBlueprint[] = [
  {
    content:
      'The signup process was quick and easy. I entered our company details, invited teammates, and reached the dashboard without needing documentation. The setup checklist clearly showed the important first steps, so the first session felt guided without being restrictive.',
    channel: 'SURVEY',
    sentiment: 'POSITIVE',
    sentimentScore: 0.86,
    featureArea: 'Onboarding',
    aiRationale: 'Customer strongly praises simple signup, team setup, and guided onboarding.',
    themeNames: ['Onboarding'],
  },
  {
    content:
      'The first invoice was difficult to understand because several charges were grouped together without enough explanation. I had to contact support to work out which amount belonged to seats and which came from adjustments. A clearer breakdown of seats, usage, taxes, and billing periods would make finance reviews much easier.',
    channel: 'SUPPORT',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.68,
    featureArea: 'Billing',
    aiRationale: 'Customer is frustrated by unclear invoice details and the need for support to understand billing.',
    themeNames: ['Billing', 'Customer Support'],
  },
  {
    content:
      'The dashboard feels considerably faster than it did when we started. Reports that previously took several seconds now appear much more quickly, even with a large feedback history. The improvement is noticeable during customer review meetings and makes the daily workflow feel much smoother.',
    channel: 'APP_STORE',
    sentiment: 'POSITIVE',
    sentimentScore: 0.82,
    featureArea: 'Performance',
    aiRationale: 'Customer reports a strong improvement in dashboard and report loading speed.',
    themeNames: ['Performance'],
  },
  {
    content:
      'I reported a login problem through chat and received help within a few minutes. The agent explained what caused the issue and stayed with me until it was fixed instead of sending a generic article. The fast and personalized response gave me much more confidence in the support team.',
    channel: 'SUPPORT',
    sentiment: 'POSITIVE',
    sentimentScore: 0.91,
    featureArea: 'Customer Support',
    aiRationale: 'Customer strongly praises fast, personalized support and successful resolution.',
    themeNames: ['Customer Support'],
  },
  {
    content:
      'I would like a dark mode option for long review sessions. I spend several hours a day reading customer comments and the bright interface becomes uncomfortable. The current information hierarchy is clear, so I would prefer a dark theme that preserves the existing navigation and layout.',
    channel: 'SURVEY',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.08,
    featureArea: 'UI/UX',
    aiRationale: 'Customer makes a constructive dark mode request without strong positive or negative sentiment.',
    themeNames: ['Feature Requests'],
  },
  {
    content:
      'Our renewal price increased significantly and we did not receive enough notice before the new amount appeared on the invoice. The price change is difficult for our budget, but the bigger problem is that finance could not plan for it. Clearer pricing communication and advance notice would help prevent customers from considering alternatives.',
    channel: 'SALES',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.88,
    featureArea: 'Billing',
    aiRationale: 'Unexpected pricing and poor advance communication create strong dissatisfaction and churn risk.',
    themeNames: ['Billing'],
  },
  {
    content:
      'The new inbox filters are a major improvement. I can narrow feedback by sentiment and channel instead of manually scanning every comment. This saves our analyst time when looking for negative issues, and the filters remain responsive even when the workspace contains a large amount of feedback.',
    channel: 'SOCIAL',
    sentiment: 'POSITIVE',
    sentimentScore: 0.84,
    featureArea: 'Feedback Inbox',
    aiRationale: 'Customer praises responsive filtering and faster feedback review.',
    themeNames: ['Performance'],
  },
  {
    content:
      'The onboarding wizard explains the basic configuration well, but team invitations are easy to miss. I finished the setup and then had to search the settings page to find where to invite colleagues. It is not a serious blocker, but new administrators could easily think onboarding is complete before granting access to their team.',
    channel: 'SURVEY',
    sentiment: 'NEUTRAL',
    sentimentScore: -0.12,
    featureArea: 'Onboarding',
    aiRationale: 'Customer identifies moderate onboarding friction around team invitations.',
    themeNames: ['Onboarding'],
  },
  {
    content:
      'Please add bulk CSV export for feedback. We regularly send filtered customer comments to product managers, but exporting records individually is repetitive and slow. The export should ideally respect the active filters and include the feedback text, sentiment, channel, feature area, and date so teams can work with the data outside the dashboard.',
    channel: 'SOCIAL',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.04,
    featureArea: 'Exports',
    aiRationale: 'Customer requests filtered bulk export to reduce repetitive manual work.',
    themeNames: ['Feature Requests'],
  },
  {
    content:
      'We have used the platform for more than two years and the product has improved considerably. The analytics are easier to understand, and the team appears to act on customer feedback instead of simply collecting it. There are still improvements we would like, but the product has become an important part of our customer experience workflow.',
    channel: 'SOCIAL',
    sentiment: 'POSITIVE',
    sentimentScore: 0.90,
    featureArea: 'Analytics',
    aiRationale: 'Long-term customer expresses strong loyalty and satisfaction with product improvement.',
    themeNames: ['Feature Requests', 'Customer Support'],
  },
  {
    content:
      'The mobile app freezes when I upload several images at once. Restarting usually fixes it, but the upload progress is lost. It has happened multiple times this week, so it does not feel isolated. Large uploads need to be more reliable, especially for field staff working from slower mobile connections.',
    channel: 'APP_STORE',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.81,
    featureArea: 'Performance',
    aiRationale: 'Repeated freezes and lost upload progress indicate a significant reliability issue.',
    themeNames: ['Performance'],
  },
  {
    content:
      'The weekly report is useful, but I want the summary to explain why a metric changed instead of only showing the change. If negative feedback increases, it would be helpful to identify the themes and feature areas driving the increase. The charts are clear, so this feels like a request for more context rather than a complaint about the current reporting experience.',
    channel: 'SURVEY',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.12,
    featureArea: 'Reports',
    aiRationale: 'Customer values reports but requests more explanatory context behind metric changes.',
    themeNames: ['Feature Requests'],
  },
  {
    content:
      'Support has been excellent whenever we have had an issue. An analyst accidentally removed a filter configuration and the chat agent helped restore it quickly. The response was clear and professional, and we did not have to repeat the problem to multiple people. Fast support makes it easier for our team to trust the platform for important reporting work.',
    channel: 'SUPPORT',
    sentiment: 'POSITIVE',
    sentimentScore: 0.88,
    featureArea: 'Customer Support',
    aiRationale: 'Customer strongly praises fast, professional support and efficient resolution.',
    themeNames: ['Customer Support'],
  },
  {
    content:
      'The billing page showed our plan correctly, but the invoice total was not easy to verify after changing the number of seats. I checked the dates and still could not understand the calculation. Whether the calculation is correct or not, administrators should be able to verify charges without manually comparing several screens.',
    channel: 'SUPPORT',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.70,
    featureArea: 'Billing',
    aiRationale: 'Customer reports confusion around seat-based billing calculations and invoice transparency.',
    themeNames: ['Billing', 'Customer Support'],
  },
  {
    content:
      'The onboarding checklist gave me a clear path through the initial configuration. I liked that optional settings did not block me from reaching the dashboard. I could start exploring analytics immediately and return to the remaining setup tasks later. The first session felt quick without making the product feel unfinished.',
    channel: 'SURVEY',
    sentiment: 'POSITIVE',
    sentimentScore: 0.83,
    featureArea: 'Onboarding',
    aiRationale: 'Customer appreciates guided but flexible onboarding.',
    themeNames: ['Onboarding'],
  },
  {
    content:
      'Search works well when I know the exact phrase, but related feedback is harder to discover. Customers often describe the same issue using different words, so I sometimes repeat searches several times. Semantic search or related results would make investigation much easier when looking for a broad problem.',
    channel: 'SOCIAL',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.03,
    featureArea: 'Search',
    aiRationale: 'Customer finds exact search useful but requests semantic discovery of related feedback.',
    themeNames: ['Feature Requests'],
  },
  {
    content:
      'The dashboard became slower after we imported a large amount of historical feedback. The analytics page can take several seconds to load and changing date ranges sometimes feels stuck. The data appears correct, but the delay makes it harder to use the dashboard during meetings. Performance needs to remain consistent as workspace data grows.',
    channel: 'APP_STORE',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.78,
    featureArea: 'Performance',
    aiRationale: 'Customer reports performance degradation after large imports and raises scalability concerns.',
    themeNames: ['Performance'],
  },
  {
    content:
      'The analytics view makes it much easier to understand where negative feedback is coming from. I can see the overall sentiment and then inspect the underlying comments instead of relying on one score. The theme breakdown is especially useful because it turns a large volume of feedback into a smaller set of areas that the product team can discuss.',
    channel: 'SURVEY',
    sentiment: 'POSITIVE',
    sentimentScore: 0.92,
    featureArea: 'Analytics',
    aiRationale: 'Customer strongly values sentiment and theme analytics for turning feedback into product insights.',
    themeNames: ['Feature Requests'],
  },
  {
    content:
      'I submitted a support request about a failed import and received an acknowledgement, but there was no useful update for almost two days. I had to follow up to find out whether anyone was investigating it. The issue was eventually resolved, but better status visibility and an estimated response time would make the experience less frustrating.',
    channel: 'SUPPORT',
    sentiment: 'NEGATIVE',
    sentimentScore: -0.74,
    featureArea: 'Customer Support',
    aiRationale: 'Customer is dissatisfied with slow support follow-up and poor status visibility.',
    themeNames: ['Customer Support'],
  },
  {
    content:
      'Saved dashboard views would be useful for different teams. Product managers care about feature requests and sentiment, while customer success focuses on support issues and recent complaints. We currently recreate the same filters whenever we switch workflows. Saved views would reduce repeated setup without changing the underlying data.',
    channel: 'SALES',
    sentiment: 'NEUTRAL',
    sentimentScore: 0.07,
    featureArea: 'Dashboard',
    aiRationale: 'Customer requests reusable dashboard views to reduce repeated filtering.',
    themeNames: ['Feature Requests'],
  },
];

const VARIATIONS = [
  'This is particularly noticeable during busy work periods when the team is reviewing feedback together.',
  'For our team, this would reduce manual work and make customer reviews easier to complete.',
  'The issue matters most when we are working with a large workspace and need answers quickly.',
  'We would consider this a meaningful improvement to the day-to-day customer feedback workflow.',
  'The main benefit would be giving analysts more time to investigate trends instead of performing repetitive tasks.',
];

const DAILY_COUNTS = [
  2, 3, 1, 4, 2, 5, 1, 3, 4, 2, 1, 5, 3, 2, 4, 1,
  6, 2, 3, 1, 5, 2, 4, 3, 1, 6, 2, 3, 4, 1, 3,
];

const START_DATE = new Date('2026-08-10T00:00:00Z');

function buildSeedFeedback(): Array<FeedbackBlueprint & { customerLabel: string; createdAt: string }> {
  const rows: Array<FeedbackBlueprint & { customerLabel: string; createdAt: string }> = [];
  let globalIndex = 0;

  for (let dayIndex = 0; dayIndex < DAILY_COUNTS.length; dayIndex++) {
    const count = DAILY_COUNTS[dayIndex];

    for (let dayItem = 0; dayItem < count; dayItem++) {
      const blueprint = FEEDBACK_BLUEPRINTS[(globalIndex * 7 + dayIndex) % FEEDBACK_BLUEPRINTS.length];
      const date = new Date(START_DATE);
      date.setUTCDate(date.getUTCDate() + dayIndex);

      const hour = 8 + ((globalIndex * 3) % 10);
      const minute = (globalIndex * 17) % 60;
      date.setUTCHours(hour, minute, 0, 0);

      const variation = VARIATIONS[globalIndex % VARIATIONS.length];

      rows.push({
        ...blueprint,
        content: `${blueprint.content} ${variation}`,
        customerLabel: `${blueprint.featureArea.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_customer_${String(globalIndex + 1).padStart(3, '0')}`,
        createdAt: date.toISOString(),
      });

      globalIndex++;
    }
  }

  return rows;
}

const SEED_FEEDBACK = buildSeedFeedback();

async function main() {
  const existingDemoWorkspace = await prisma.workspace.findFirst({
    where: { name: 'HermesX Demo' },
  });

  const workspace =
    existingDemoWorkspace ??
    (await prisma.workspace.create({
      data: { name: 'HermesX Demo' },
    }));

  /*
   * Only clear demo feedback/theme data.
   * Other workspaces and manually-created accounts are not touched.
   */
  await prisma.feedbackTheme.deleteMany({
    where: {
      feedback: {
        workspaceId: workspace.id,
      },
    },
  });

  await prisma.feedback.deleteMany({
    where: {
      workspaceId: workspace.id,
    },
  });

  await prisma.theme.deleteMany({
    where: {
      workspaceId: workspace.id,
    },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const demoUsers = [
    {
      name: 'Demo Admin',
      email: 'admin@hermesx.dev',
      role: 'ADMIN' as const,
    },
    {
      name: 'Demo Analyst',
      email: 'analyst@hermesx.dev',
      role: 'ANALYST' as const,
    },
    {
      name: 'Demo Viewer',
      email: 'viewer@hermesx.dev',
      role: 'VIEWER' as const,
    },
  ];

  for (const user of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: user.name,
          passwordHash,
          role: user.role,
          workspaceId: workspace.id,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          workspaceId: workspace.id,
        },
      });
    }
  }

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
    const createdAt = new Date(item.createdAt);

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
        classifiedAt: createdAt,
        createdAt,
        status: 'NEW',
        workspaceId: workspace.id,
      },
    });

    for (const themeName of item.themeNames) {
      const themeId = themesByName.get(themeName);

      if (!themeId) continue;

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId,
          confidence: 0.9,
        },
      });
    }

    createdFeedback.push({
      feedbackId: feedback.id,
      content: feedback.content,
    });
  }

  try {
    await upsertFeedbackEmbeddingsBatch(createdFeedback);

    console.log(
      `Generated embeddings for ${createdFeedback.length} seeded feedback rows.`
    );
  } catch (error) {
    console.warn(
      'Skipping embeddings — Cohere call failed during seed (this is non-fatal):',
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log('Seed complete.');
  console.log(`Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`Seeded feedback: ${SEED_FEEDBACK.length}`);
  console.log(`Date range: 2026-08-10 through 2026-09-09`);
  console.log(`Demo password for all roles: ${DEMO_PASSWORD}`);
  console.log('Demo accounts:');
  console.log('  ADMIN   admin@hermesx.dev');
  console.log('  ANALYST analyst@hermesx.dev');
  console.log('  VIEWER  viewer@hermesx.dev');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });