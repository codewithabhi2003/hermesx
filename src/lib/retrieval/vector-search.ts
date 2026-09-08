import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * Workspace-scoped semantic retrieval over `Embedding` via pgvector.
 *
 * SECURITY: this is one of the tenant-owned resources called out in the
 * project brief — retrieval MUST be filtered by the authenticated
 * workspace at the SQL level. There is no code path in this module that
 * performs a global, unscoped vector search.
 */

const MAX_TOP_K = 20;
const DEFAULT_TOP_K = 5;
/** Cosine similarity below this is considered irrelevant noise. */
const SIMILARITY_THRESHOLD = 0.35;

export interface SimilarFeedbackResult {
  feedbackId: string;
  content: string;
  sentiment: string | null;
  channel: string;
  createdAt: Date;
  similarity: number;
}

export interface FindSimilarFeedbackOptions {
  workspaceId: string;
  queryVector: number[];
  topK?: number;
}

function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

export async function findSimilarFeedback({
  workspaceId,
  queryVector,
  topK = DEFAULT_TOP_K,
}: FindSimilarFeedbackOptions): Promise<SimilarFeedbackResult[]> {
  const boundedTopK = Math.min(Math.max(topK, 1), MAX_TOP_K);
  const vectorLiteral = toVectorLiteral(queryVector);

  // Cosine distance operator `<=>` returns 0 for identical vectors and up
  // to 2 for opposite ones; similarity = 1 - distance. The workspaceId
  // filter runs on the joined `feedback` table so a query can never surface
  // another tenant's rows regardless of embedding similarity.
  const rows = await prisma.$queryRaw<
    Array<{
      feedbackId: string;
      content: string;
      sentiment: string | null;
      channel: string;
      createdAt: Date;
      similarity: number;
    }>
  >(Prisma.sql`
    SELECT
      f.id AS "feedbackId",
      f.content AS "content",
      f.sentiment::text AS "sentiment",
      f.channel::text AS "channel",
      f."createdAt" AS "createdAt",
      1 - (e.vector <=> ${vectorLiteral}::vector) AS "similarity"
    FROM "embeddings" e
    INNER JOIN "feedback" f ON f.id = e."feedbackId"
    WHERE f."workspaceId" = ${workspaceId}
      AND 1 - (e.vector <=> ${vectorLiteral}::vector) >= ${SIMILARITY_THRESHOLD}
    ORDER BY e.vector <=> ${vectorLiteral}::vector ASC
    LIMIT ${boundedTopK}
  `);

  return rows;
}
