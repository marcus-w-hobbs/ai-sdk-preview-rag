import { ContentIngestionService } from '@/lib/services/content-ingestion'
import { ingestMarkdownSchema } from '@/lib/validations/content'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = ingestMarkdownSchema.parse(body)

    const service = new ContentIngestionService()
    const result = await service.processMarkdown(
      validatedData.content,
      validatedData.name,
      validatedData.categoryId
    )
    
    return NextResponse.json({ result })
  } catch (error) {
    console.error('[/api/resource] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process markdown' },
      { status: 500 }
    )
  }
} 