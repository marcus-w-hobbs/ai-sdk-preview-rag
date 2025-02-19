import { z } from 'zod'

export const ingestPdfSchema = z.object({
  file: z.instanceof(Buffer),
  name: z.string().min(1),
  categoryId: z.string().optional()
})

export const ingestMarkdownSchema = z.object({
  content: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().optional()
})

export const ingestUrlSchema = z.object({
  url: z.string().url(),
  categoryId: z.string().optional()
})

export const ingestBatchSchema = z.object({
  items: z.array(z.union([
    z.object({
      type: z.literal('pdf'),
      file: z.instanceof(Buffer),
      name: z.string().min(1)
    }),
    z.object({
      type: z.literal('markdown'),
      content: z.string().min(1),
      name: z.string().min(1)
    }),
    z.object({
      type: z.literal('url'),
      url: z.string().url()
    })
  ])),
  categoryId: z.string().optional()
})

export type IngestPdfRequest = z.infer<typeof ingestPdfSchema>
export type IngestMarkdownRequest = z.infer<typeof ingestMarkdownSchema>
export type IngestUrlRequest = z.infer<typeof ingestUrlSchema>
export type IngestBatchRequest = z.infer<typeof ingestBatchSchema> 