import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/permissions';
import { updateThemeSchema, themeIdParamSchema } from '@/lib/validation/themes';
import { ok, handleRouteError } from '@/lib/responses';
import { NotFoundError, ConflictError } from '@/lib/errors';

interface RouteParams {
  params: { id: string };
}

/** PATCH /api/themes/:id — ADMIN/ANALYST, workspace scoped. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN', 'ANALYST');
    const { id } = themeIdParamSchema.parse(params);

    const body = await request.json();
    const updates = updateThemeSchema.parse(body);

    const existing = await prisma.theme.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!existing) {
      throw new NotFoundError('Theme not found.');
    }

    if (updates.name && updates.name !== existing.name) {
      const nameTaken = await prisma.theme.findUnique({
        where: { workspaceId_name: { workspaceId: auth.workspaceId, name: updates.name } },
      });
      if (nameTaken) {
        throw new ConflictError('A theme with this name already exists.');
      }
    }

    const theme = await prisma.theme.update({
      where: { id: existing.id },
      data: updates,
      include: { _count: { select: { feedbackThemes: true } } },
    });

    return ok({
      id: theme.id,
      name: theme.name,
      description: theme.description,
      color: theme.color,
      workspaceId: theme.workspaceId,
      feedbackCount: theme._count.feedbackThemes,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * DELETE /api/themes/:id
 *
 * ADMIN only (ANALYST may manage themes but not delete them, per the
 * permission matrix). Workspace scoped. Cascade removes associated
 * FeedbackTheme rows without orphaning them (see schema.prisma).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole('ADMIN');
    const { id } = themeIdParamSchema.parse(params);

    const existing = await prisma.theme.findFirst({
      where: { id, workspaceId: auth.workspaceId },
    });

    if (!existing) {
      throw new NotFoundError('Theme not found.');
    }

    await prisma.theme.delete({ where: { id: existing.id } });

    return ok({ id: existing.id, deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
