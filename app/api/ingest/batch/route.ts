import { NextRequest } from 'next/server'
import { ContentIngestionService } from '@/lib/services/content-ingestion'
import { ingestBatchSchema } from '@/lib/validations/content'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const items = JSON.parse(formData.get('items') as string)
    const categoryId = formData.get('categoryId') as string | undefined

    // Process files in formData
    const processedItems = await Promise.all(
      items.map(async (item: any) => {
        if (item.type === 'pdf') {
          const file = formData.get(`file-${item.name}`) as File
          return {
            ...item,
            file: Buffer.from(await file.arrayBuffer())
          }
        }
        return item
      })
    )

    const validatedData = ingestBatchSchema.parse({
      items: processedItems,
      categoryId
    })

    const service = new ContentIngestionService()
    const results = await Promise.all(
      validatedData.items.map(async (item) => {
        try {
          if (item.type === 'pdf') {
            return await service.processPdf(item.file, item.name, validatedData.categoryId)
          } else if (item.type === 'markdown') {
            return await service.processMarkdown(item.content, item.name, validatedData.categoryId)
          } else if (item.type === 'url') {
            return await service.processUrl(item.url, validatedData.categoryId)
          }
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Processing failed',
            item
          }
        }
      })
    )

    return Response.json({ results })
  } catch (error) {
    console.error('Batch ingestion error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process batch' },
      { status: 400 }
    )
  }
} 