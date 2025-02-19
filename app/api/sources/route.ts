import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sources, contentItems } from '@/lib/db/schema/content'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const query = db.select().from(sources)
    
    if (type) {
      query.where(eq(sources.type, type as any))
    }

    const results = await query
    return Response.json(results)
  } catch (error) {
    console.error('Sources fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // Delete associated content items first
    await db.delete(contentItems).where(eq(contentItems.sourceId, id))
    
    // Then delete the source
    await db.delete(sources).where(eq(sources.id, id))
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Source deletion error:', error)
    return Response.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    )
  }
} 