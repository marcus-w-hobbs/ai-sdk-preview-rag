import { NextRequest } from 'next/server'
import { ContentIngestionService } from '@/lib/services/content-ingestion'
import { ingestPdfSchema } from '@/lib/validations/content'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  console.warn('🚀 PDF upload started')
  
  try {
    // Check content type
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data'))
      return Response.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )

    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string | undefined

    console.warn('📝 Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      name,
      categoryId: categoryId || 'none'
    })

    // Validate file
    if (!file)
      return Response.json({ error: 'No file provided' }, { status: 400 })
    
    if (file.size === 0)
      return Response.json({ error: 'File is empty' }, { status: 400 })
    
    if (file.size > MAX_FILE_SIZE)
      return Response.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    
    if (file.type !== 'application/pdf')
      return Response.json(
        { error: 'Invalid file type. Only PDF files are accepted' },
        { status: 400 }
      )

    const buffer = Buffer.from(await file.arrayBuffer())
    console.warn('📦 File converted to buffer, size:', buffer.length)
    
    try {
      const validatedData = ingestPdfSchema.parse({
        file: buffer,
        name,
        categoryId: categoryId || undefined
      })
      console.warn('✅ Data validation passed')

      const service = new ContentIngestionService()
      console.warn('🔄 Starting PDF processing')
      
      const result = await service.processPdf(
        validatedData.file,
        validatedData.name,
        validatedData.categoryId
      )
      
      console.warn('✨ PDF processing completed:', result)
      return Response.json(result)
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific PDF processing errors
        if (error.message.includes('password protected'))
          return Response.json(
            { error: 'Cannot process password-protected PDF files' },
            { status: 400 }
          )
        
        if (error.message.includes('corrupted'))
          return Response.json(
            { error: 'The PDF file appears to be corrupted or invalid' },
            { status: 400 }
          )
        
        if (error.message.includes('too complex'))
          return Response.json(
            { error: 'The PDF file is too complex to process' },
            { status: 400 }
          )
      }
      
      throw error // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('❌ PDF ingestion error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    })

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError')
      return Response.json({ error: 'Invalid request data' }, { status: 400 })

    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process PDF' },
      { status: 500 }
    )
  }
} 