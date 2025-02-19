import { marked } from 'marked'
import { db } from '@/lib/db'
import { sources, contentItems } from '@/lib/db/schema/content'
import { embeddings } from '@/lib/db/schema/embeddings'
import { eq } from 'drizzle-orm'
import { generateEmbeddings } from '@/lib/ai/embedding'
import { sql } from 'drizzle-orm'

interface ContentProcessor {
  process(content: string | Buffer): Promise<{
    title: string
    content: string
    metadata?: Record<string, any>
  }>
}

class PdfProcessor implements ContentProcessor {
  async process(content: Buffer) {
    if (content.length === 0) throw new Error('PDF content is empty')
    if (content.length > 50 * 1024 * 1024) throw new Error('PDF file too large (max 50MB)')

    console.warn('📄 Processing PDF content', { size: content.length })
    
    try {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
      console.warn('📄 Starting PDF parsing')
      
      const result = await pdfParse(Buffer.from(content))

      if (!result.text || result.text.length === 0) 
        throw new Error('PDF parsing succeeded but extracted text is empty')

      console.warn('📄 PDF parsed successfully:', {
        title: result.info.Title || 'Untitled PDF',
        pageCount: result.numpages,
        textLength: result.text.length,
        metadata: result.metadata,
        info: result.info
      })

      return {
        title: result.info.Title || 'Untitled PDF',
        content: result.text,
        metadata: {
          author: result.info.Author,
          pageCount: result.numpages,
          version: result.info.PDFFormatVersion,
          producer: result.info.Producer,
          creator: result.info.Creator,
          creationDate: result.info.CreationDate,
          modificationDate: result.info.ModDate,
          ...result.info
        }
      }
    } catch (error) {
      console.error('📄 PDF parsing error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      })

      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF structure')) 
          throw new Error('Invalid or corrupted PDF file')
        if (error.message.includes('Password required')) 
          throw new Error('PDF is password protected')
        if (error.message.includes('out of memory')) 
          throw new Error('PDF file is too complex to process')
        if (error.message.includes('no such file or directory'))
          throw new Error('Internal server error: PDF processing failed')
      }

      throw new Error(error instanceof Error ? error.message : 'Failed to parse PDF')
    }
  }
}

class MarkdownProcessor implements ContentProcessor {
  async process(content: string) {
    console.warn('📝 Processing Markdown content')
    const tokens = marked.lexer(content)
    const headingToken = tokens.find(token => 
      token.type === 'heading' && 
      'depth' in token && 
      token.depth === 1 &&
      'text' in token
    )
    const title = (headingToken as { text: string } | undefined)?.text || 'Untitled Document'
    const processedContent = marked.parser(tokens)
    
    return {
      title,
      content: processedContent,
      metadata: {
        wordCount: content.split(/\s+/).length
      }
    }
  }
}

class UrlProcessor implements ContentProcessor {
  async process(content: string) {
    console.warn('🌐 Processing URL content')
    const { extract } = await import('@extractus/article-extractor')
    const article = await extract(content)
    if (!article) throw new Error('Failed to extract article content')
    
    return {
      title: article.title || 'Untitled Article',
      content: article.content || '',
      metadata: {
        author: article.author,
        publishedDate: article.published,
        url: article.url,
        source: article.source
      }
    }
  }
}

const processors: Record<string, ContentProcessor> = {
  pdf: new PdfProcessor(),
  markdown: new MarkdownProcessor(),
  url: new UrlProcessor()
}

interface NewSource {
  name: string
  type: 'pdf' | 'markdown' | 'url'
  metadata: Record<string, any>
}

interface NewContentItem {
  sourceId: string
  categoryId?: string
  title: string
  content: string
  status: 'processing' | 'completed' | 'failed'
}

export class ContentIngestionService {
  private async createSource(params: NewSource) {
    console.warn('📝 Creating source record:', params.name)
    const [source] = await db.insert(sources).values(params).returning()
    console.warn('✅ Source created:', source.id)
    return source
  }

  private async createContentItem(params: NewContentItem) {
    console.warn('📝 Creating content item:', params.title)
    const [item] = await db.insert(contentItems).values(params).returning()
    console.warn('✅ Content item created:', item.id)
    return item
  }

  private async createEmbeddings(contentId: string, chunks: Array<{ content: string; embedding: number[] }>) {
    console.warn('🧮 Creating embeddings for content:', contentId, 'chunk count:', chunks.length)
    
    const BATCH_SIZE = 25
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      console.warn(`📥 Inserting batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(chunks.length/BATCH_SIZE)}`)
      
      try {
        // Create the vector SQL expression directly
        await db.insert(embeddings).values(
          batch.map(chunk => ({
            contentId,
            content: chunk.content,
            embedding: sql.raw(`'[${chunk.embedding.join(',')}]'::vector`),
          }))
        )
        console.warn(`✅ Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1}`)
      } catch (error) {
        console.error('❌ Batch insertion error:', {
          error,
          batchIndex: i,
          batchSize: batch.length,
          sampleEmbedding: batch[0].embedding.slice(0, 5)
        })
        throw error
      }
      
      // Small delay between batches to prevent database overload
      if (i + BATCH_SIZE < chunks.length) {
        console.warn('😴 Short pause between database inserts...')
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    console.warn('✅ Embeddings created successfully')
  }

  private async updateContentStatus(id: string, status: 'processing' | 'completed' | 'failed', error?: string) {
    console.warn('🔄 Updating content status:', { id, status, error })
    await db.update(contentItems)
      .set({ 
        status, 
        processingError: error,
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, id))
    console.warn('✅ Content status updated')
  }

  async processContent(
    type: 'pdf' | 'markdown' | 'url',
    content: Buffer | string,
    sourceName: string,
    categoryId?: string
  ) {
    console.warn('🚀 Starting content processing:', { type, sourceName, categoryId })
    
    // Create source record
    const source = await this.createSource({
      name: sourceName,
      type,
      metadata: {}
    })

    try {
      // Process content using appropriate processor
      console.warn('🔄 Processing content with', type, 'processor')
      const processor = processors[type]
      const { title, content: processedContent, metadata } = await processor.process(content)

      // Create content item
      const contentItem = await this.createContentItem({
        sourceId: source.id,
        categoryId,
        title,
        content: processedContent,
        status: 'processing'
      })

      // Update source with metadata
      console.warn('📝 Updating source metadata')
      await db.update(sources)
        .set({ metadata })
        .where(eq(sources.id, source.id))

      // Generate and store embeddings
      console.warn('🧮 Generating embeddings')
      const chunks = await generateEmbeddings(processedContent)
      await this.createEmbeddings(contentItem.id, chunks)
      
      // Update status
      await this.updateContentStatus(contentItem.id, 'completed')

      console.warn('✨ Content processing completed successfully')
      return {
        sourceId: source.id,
        contentId: contentItem.id,
        chunkCount: chunks.length
      }
    } catch (error) {
      console.error('❌ Content processing failed:', error)
      await this.updateContentStatus(source.id, 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  async processPdf(buffer: Buffer, name: string, categoryId?: string) {
    console.log('Processing PDF:', { name, categoryId })
    return this.processContent('pdf', buffer, name, categoryId)
  }

  async processMarkdown(content: string, name: string, categoryId?: string) {
    return this.processContent('markdown', content, name, categoryId)
  }

  async processUrl(url: string, categoryId?: string) {
    return this.processContent('url', url, url, categoryId)
  }
} 