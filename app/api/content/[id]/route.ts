import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { contentItems, sources } from '@/lib/db/schema/content'
import { eq } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [item] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, params.id))
      .leftJoin(sources, eq(contentItems.sourceId, sources.id))

    if (!item) {
      return Response.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return Response.json(item)
  } catch (error) {
    console.error('Content fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [item] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, params.id))

    if (!item) {
      return Response.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Delete the content item
    await db.delete(contentItems).where(eq(contentItems.id, params.id))

    // Check if there are other content items using the same source
    const [otherItems] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.sourceId, item.sourceId))

    // If no other items use this source, delete it
    if (!otherItems) {
      await db.delete(sources).where(eq(sources.id, item.sourceId))
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Content deletion error:', error)
    return Response.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    )
  }
} 