import { NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/permissions';
import { NotFoundError } from '@/lib/errors';
import { handleRouteError } from '@/lib/responses';
import { ReportPdfDocument, type ReportPdfData } from '@/lib/pdf/report-pdf';
import type { ReportContentDto } from '@/types';

interface RouteParams {
  params: { id: string };
}

function toSafeFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'hermesx-report';
}

/**
 * GET /api/reports/:id/pdf
 *
 * Any authenticated role, workspace scoped (same access as GET
 * /api/reports/:id). Generates a REAL PDF file server-side from the
 * report's already-stored narrative and stats — this is not a screenshot
 * of the web page, and it makes no new Groq calls: the AI content was
 * already generated when the report itself was created, so this route
 * only handles layout and rendering.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();

    const report = await prisma.report.findFirst({
      where: { id: params.id, workspaceId: auth.workspaceId },
      include: { generatedByUser: { select: { name: true } } },
    });

    if (!report) {
      throw new NotFoundError('Report not found.');
    }

    const workspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: auth.workspaceId },
      select: { name: true },
    });

    const pdfData: ReportPdfData = {
      workspaceName: workspace.name,
      title: report.title,
      periodStart: report.periodStart.toISOString(),
      periodEnd: report.periodEnd.toISOString(),
      createdAt: report.createdAt.toISOString(),
      generatedByName: report.generatedByUser.name,
      content: report.contentJson as unknown as ReportContentDto,
    };

    const buffer = await renderToBuffer(<ReportPdfDocument data={pdfData} />);
    const filename = toSafeFilename(report.title);

    // Response's BodyInit type doesn't structurally accept Node's Buffer
    // type in this TS config, even though it works fine at runtime —
    // Uint8Array.from() copies the bytes into a plain Uint8Array, which
    // satisfies the type checker with zero behavior change.
    return new Response(Uint8Array.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}