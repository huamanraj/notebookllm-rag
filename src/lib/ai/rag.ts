import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { db } from "../db";
import { documents } from "../db/schema";
import { nanoid } from "nanoid";

export async function processAndEmbed(
  text: string, 
  sourceId: string, 
  notebookId: string, 
  metadataFn: (chunkIndex: number, totalChunks: number) => Record<string, unknown>
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([text]);
  const chunkTexts = chunks.map(c => c.pageContent);
  
  if (chunkTexts.length === 0) return;

  // Generate embeddings
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunkTexts,
  });

  // Insert into DB
  const inserts = chunkTexts.map((content, i) => ({
    id: nanoid(),
    sourceId,
    notebookId,
    content,
    metadata: JSON.stringify(metadataFn(i, chunkTexts.length)),
    embedding: embeddings[i] as number[],
  }));

  // Batch insert
  await db.insert(documents).values(inserts);
}
