import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import OpenAI from "openai";
import { StreamingTextResponse } from "ai";
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
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant acting as the users' second brain.
    Use tools on every request.
    Be sure to getInformation from your knowledge base before answering any questions.
    If the user presents information about themselves, use the addResource tool to store it.
    If a response requires multiple tools, call one tool after another without responding to the user.
    If a response requires information from an additional tool to generate a response, call the appropriate tools in order before responding to the user.
    ONLY respond to questions using information from tool calls.
    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."
    Be sure to adhere to any instructions in tool calls ie. if they say to responsd like "...", do exactly that.
    If the relevant information is not a direct match to the users prompt, you can be creative in deducing the answer.
    Keep responses short and concise. Answer in a single sentence where possible.
    If you are unsure, use the getInformation tool and you can use common sense to reason based on the information you do have.
    Use your abilities as a reasoning machine to answer questions based on the information you do have.`
      },
      ...messages
    ],
    stream: true,
    tools: [
      {
        type: "function",
        function: {
          name: "addResource",
          description: "Add a resource to your knowledge base. If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "the content or resource to add to the knowledge base"
              }
            },
            required: ["content"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getInformation",
          description: "Get information from your knowledge base to answer questions.",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "the users question"
              },
              similarQuestions: {
                type: "array",
                items: { type: "string" },
                description: "keywords to search"
              }
            },
            required: ["question", "similarQuestions"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "understandQuery",
          description: "Understand the users query. Use this tool on every prompt.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "the users query"
              },
              toolsToCallInOrder: {
                type: "array",
                items: { type: "string" },
                description: "these are the tools you need to call in the order necessary to respond to the users query"
              }
            },
            required: ["query", "toolsToCallInOrder"]
          }
        }
      }
    ]
  });

  // Convert the response into a text stream
  const stream = new ReadableStream({
    async start(controller) {
      let currentToolCall = null;
      let accumulatedArguments = '';
      
      for await (const chunk of response) {
        console.log('Processing chunk:', {
          hasToolCalls: !!chunk.choices[0]?.delta?.tool_calls,
          hasContent: !!chunk.choices[0]?.delta?.content,
          finishReason: chunk.choices[0]?.finish_reason
        });

        if (chunk.choices[0]?.delta?.tool_calls) {
          const toolCall = chunk.choices[0].delta.tool_calls[0];
          
          // Start of a new tool call
          if (toolCall.function?.name) {
            console.log('Starting new tool call:', toolCall.function.name);
            currentToolCall = toolCall.function.name;
            accumulatedArguments = toolCall.function.arguments || '';
          } 
          // Continuation of current tool call
          else if (toolCall.function?.arguments) {
            console.log('Accumulating arguments:', toolCall.function.arguments);
            accumulatedArguments += toolCall.function.arguments;
          }
        }
        
        // Check if this is the end of the tool call
        if (chunk.choices[0]?.finish_reason === 'tool_calls' && currentToolCall) {
          console.log('Completed tool call:', {
            name: currentToolCall,
            arguments: accumulatedArguments
          });
          
          if (currentToolCall === 'addResource') {
            try {
              const params = JSON.parse(accumulatedArguments);
              console.log('Attempting to create resource with params:', params);
              await createResource({ content: params.content });
              console.log('Resource created successfully');
            } catch (error) {
              console.error('Error processing addResource tool call:', {
                error,
                rawArguments: accumulatedArguments
              });
            }
          } else if (currentToolCall === 'getInformation') {
            try {
              const params = JSON.parse(accumulatedArguments);
              console.log('Searching for information:', params);
              const relevantContent = await findRelevantContent(params.question);
              console.log('Found relevant content:', relevantContent);
              
              // Stream the found information back to the model
              if (relevantContent && relevantContent.length > 0) {
                controller.enqueue('Based on the stored information: ');
                controller.enqueue(relevantContent[0].name);
              } else {
                controller.enqueue('I don\'t have any information about that in my knowledge base.');
              }
            } catch (error) {
              console.error('Error processing getInformation tool call:', {
                error,
                rawArguments: accumulatedArguments
              });
              controller.enqueue('Sorry, I encountered an error while retrieving information.');
            }
          }
          
          // Reset for next tool call
          currentToolCall = null;
          accumulatedArguments = '';
        }
        
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
