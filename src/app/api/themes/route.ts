import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireRole } from '@/lib/auth/permissions';
import { createThemeSchema } from '@/lib/validation/themes';
import { ok, handleRouteError } from '@/lib/responses';
import { ConflictError } from '@/lib/errors';

/**
 * GET /api/themes
 *
 * Any authenticated role. Workspace scoped. Includes a `feedbackCount`
 * computed from the FeedbackTheme relation.
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    const themes = await prisma.theme.findMany({
      where: { workspaceId: auth.workspaceId },
      include: { _count: { select: { feedbackThemes: true } } },
      orderBy: { name: 'asc' },
    });

    return ok(
      themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        workspaceId: theme.workspaceId,
        feedbackCount: theme._count.feedbackThemes,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/themes
 *
 * ADMIN/ANALYST. Creates a theme under the authenticated workspace. Theme
 * names must be unique within a workspace (enforced by the schema's
 * `@@unique([workspaceId, name])`), so duplicates surface as a clean 409.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');

    const body = await request.json();
    const input = createThemeSchema.parse(body);

    const existing = await prisma.theme.findUnique({
      where: { workspaceId_name: { workspaceId: auth.workspaceId, name: input.name } },
    });

    if (existing) {
      throw new ConflictError('A theme with this name already exists.');
    }

    const theme = await prisma.theme.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        color: input.color,
        workspaceId: auth.workspaceId,
      },
    });

    return ok(
      {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        workspaceId: theme.workspaceId,
        feedbackCount: 0,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
