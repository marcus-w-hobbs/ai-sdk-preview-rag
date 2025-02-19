import { NextRequest, NextResponse } from "next/server"
import { ContentIngestionService } from "@/lib/services/content-ingestion"
import { ingestMarkdownSchema } from "@/lib/validations/content"

export async function POST(req: NextRequest) {
  console.log("Received markdown ingestion request")
  try {
    const body = await req.json()
    console.log("Request body:", body)
    
    const validatedData = ingestMarkdownSchema.parse(body)
    console.log("Validated data:", validatedData)

    const service = new ContentIngestionService()
    const result = await service.processMarkdown(
      validatedData.content,
      validatedData.name,
      validatedData.categoryId
    )
    console.log("Processing result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Markdown ingestion error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process Markdown" },
      { status: 400 }
    )
  }
} 