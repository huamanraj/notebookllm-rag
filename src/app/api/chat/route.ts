import { openai } from "@ai-sdk/openai";
import { streamText, embed } from "ai";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { messages, notebookId } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Step 1: Embed the user query
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: lastMessage.content,
  });

  // Step 2: Retrieve relevant chunks using vector similarity
  const similarity = sql<number>`1 - (${documents.embedding} <=> ${JSON.stringify(embedding)})`;
  const relevantChunks = await db
    .select({
      content: documents.content,
      metadata: documents.metadata,
      sourceId: documents.sourceId,
      similarity,
    })
    .from(documents)
    .where(sql`${documents.notebookId} = ${notebookId}`)
    .orderBy((t) => sql`${t.embedding} <=> ${JSON.stringify(embedding)}`)
    .limit(5);

  const contextText = relevantChunks
    .map(
      (chunk, idx) =>
        `[Citation ${idx + 1}] (Source ID: ${chunk.sourceId}, Meta: ${chunk.metadata}):\n${chunk.content}`
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful research assistant. 
You are given context extracted from the user's uploaded sources.
Use the context to answer the user's question accurately. 
ALWAYS cite your sources by referencing the [Citation N] block. 
Format citations elegantly, like "According to the document [1]...".

Context:
${contextText}
`;

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
