import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { contentItems, sources, categories } from '@/lib/db/schema/content'
import { eq, and } from 'drizzle-orm'

// Mark route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const sourceId = searchParams.get('sourceId')
    const status = searchParams.get('status')

    // Build conditions array
    const conditions = []
    if (categoryId) conditions.push(eq(contentItems.categoryId, categoryId))
    if (sourceId) conditions.push(eq(contentItems.sourceId, sourceId))
    if (status) conditions.push(eq(contentItems.status, status as any))

    const results = await db
      .select({
        id: contentItems.id,
        title: contentItems.title,
        sourceId: contentItems.sourceId,
        categoryId: contentItems.categoryId,
        status: contentItems.status,
        createdAt: contentItems.createdAt,
        source: {
          name: sources.name,
          type: sources.type
        },
        category: {
          name: categories.name
        }
      })
      .from(contentItems)
      .leftJoin(sources, eq(contentItems.sourceId, sources.id))
      .leftJoin(categories, eq(contentItems.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(contentItems.createdAt)

    return Response.json(results)
  } catch (error) {
    console.error('Content fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
} 