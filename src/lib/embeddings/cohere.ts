import { randomUUID } from 'crypto';
import { CohereClient } from 'cohere-ai';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';
import { AIError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * All Cohere-specific wiring is isolated here. Nothing else in the
 * codebase should import `cohere-ai` directly.
 */

const client = new CohereClient({ token: env.COHERE_API_KEY });

function assertDimensions(vector: number[]): number[] {
  if (vector.length !== env.EMBEDDING_DIMENSIONS) {
    logger.error('Cohere returned an unexpected embedding dimension', {
      expected: env.EMBEDDING_DIMENSIONS,
      actual: vector.length,
    });
    throw new AIError('The embedding provider returned an unexpected vector size.');
  }
  return vector;
}

/** Embeds a single piece of stored content (feedback) for later retrieval. */
export async function embedDocument(text: string): Promise<number[]> {
  const [vector] = await embedBatch([text]);
  return vector;
}

/** Embeds a user's search/question text for querying against stored vectors. */
export async function embedQuery(text: string): Promise<number[]> {
  try {
    const response = await client.embed({
      texts: [text],
      model: env.COHERE_EMBED_MODEL,
      inputType: 'search_query',
    });

    const vector = (response.embeddings as number[][])?.[0];
    if (!vector) {
      throw new AIError('The embedding provider returned no vector.');
    }
    return assertDimensions(vector);
  } catch (error) {
    logger.error('Cohere query embedding failed', { message: String(error) });
    throw new AIError('Failed to generate a query embedding.');
  }
}

/**
 * Batch document embedding — used for CSV import and database seeding so
 * we never issue one Cohere request per row.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  try {
    const response = await client.embed({
      texts,
      model: env.COHERE_EMBED_MODEL,
      inputType: 'search_document',
    });

    const vectors = response.embeddings as number[][];
    if (!vectors || vectors.length !== texts.length) {
      throw new AIError('The embedding provider returned an unexpected number of vectors.');
    }
    return vectors.map(assertDimensions);
  } catch (error) {
    logger.error('Cohere batch embedding failed', { message: String(error), count: texts.length });
    throw new AIError('Failed to generate embeddings.');
  }
}

/**
 * Persistence helpers.
 *
 * The `Embedding.vector` column is a Prisma `Unsupported("vector(1024)")`
 * type, so the generated client cannot write to it through ordinary
 * `create`/`update` calls — raw SQL is required. These helpers are kept
 * alongside the embedding provider calls (rather than in a separate file)
 * since the repository structure has no dedicated embedding-storage
 * module, and this keeps "generate + store a feedback embedding" as one
 * cohesive operation for every call site (feedback create/update, CSV
 * import, seeding).
 */

async function persistEmbedding(feedbackId: string, vector: number[]): Promise<void> {
  const vectorLiteral = `[${vector.join(',')}]`;

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "embeddings" (id, "feedbackId", vector, "createdAt")
    VALUES (${randomUUID()}, ${feedbackId}, ${vectorLiteral}::vector, now())
    ON CONFLICT ("feedbackId")
    DO UPDATE SET vector = EXCLUDED.vector
  `);
}

/** Generates and stores/updates the embedding for a single feedback row. */
export async function upsertFeedbackEmbedding(feedbackId: string, content: string): Promise<void> {
  const vector = await embedDocument(content);
  await persistEmbedding(feedbackId, vector);
}

/** Generates and stores/updates embeddings for many feedback rows in one batch call. */
export async function upsertFeedbackEmbeddingsBatch(
  items: { feedbackId: string; content: string }[]
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const vectors = await embedBatch(items.map((item) => item.content));
  await Promise.all(items.map((item, index) => persistEmbedding(item.feedbackId, vectors[index])));
}
