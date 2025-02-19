import { NextRequest } from 'next/server'
import { ContentIngestionService } from '@/lib/services/content-ingestion'
import { ingestUrlSchema } from '@/lib/validations/content'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = ingestUrlSchema.parse(body)

    const service = new ContentIngestionService()
    const result = await service.processUrl(
      validatedData.url,
      validatedData.categoryId
    )

    return Response.json(result)
  } catch (error) {
    console.error('URL ingestion error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process URL' },
      { status: 400 }
    )
  }
} 