import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import OpenAI from "openai";
import { StreamingTextResponse, Message } from "ai";
import { z } from "zod";
import { env } from "@/lib/env.mjs";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    stream: true,
  });

  // Convert the response into a text stream
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(content);
        }
      }
      controller.close();
    },
  });
  
  return new StreamingTextResponse(stream);
}

interface ToolCallParams {
  content: string;
}

interface SearchParams {
  similarQuestions: string[];
}

interface QueryParams {
  query: string;
  toolsToCallInOrder: string[];
}
