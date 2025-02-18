import { createResource } from "@/lib/actions/resources"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    const result = await createResource({ content })
    return NextResponse.json({ result })
  } catch (error) {
    console.error("[/api/resource] Error:", error)
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
  }
} 