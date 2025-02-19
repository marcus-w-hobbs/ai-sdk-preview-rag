import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema/content'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
})

export async function GET() {
  try {
    const results = await db.select().from(categories)
    return Response.json(results)
  } catch (error) {
    console.error('Category fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = createCategorySchema.parse(body)

    const [category] = await db
      .insert(categories)
      .values(validatedData)
      .returning()

    return Response.json(category)
  } catch (error) {
    console.error('Category creation error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 400 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    await db.delete(categories).where(eq(categories.id, id))
    return Response.json({ success: true })
  } catch (error) {
    console.error('Category deletion error:', error)
    return Response.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 