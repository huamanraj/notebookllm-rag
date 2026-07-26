import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sources } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { processAndEmbed } from '@/lib/ai/rag';
import PDFParser from 'pdf2json';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_TEXT_LENGTH = 20000; // ~ 10 pages approx

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });
    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const notebookId = formData.get('notebookId') as string;
  const type = formData.get('type') as string; 

  if (!notebookId || !type) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const sourceId = nanoid();
  let name = formData.get('name') as string || 'Untitled Source';
  let url = formData.get('url') as string || '';
  
  await db.insert(sources).values({
    id: sourceId,
    notebookId,
    name,
    type,
    url,
    status: 'indexing'
  });

  try {
    let textToProcess = '';
    
    if (type === 'pdf') {
      const file = formData.get('file') as File;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File exceeds 2 MB limit' }, { status: 400 });
      
      name = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      textToProcess = await extractTextFromPDF(buffer);
    } 
    else if (type === 'text' || type === 'vtt') {
      const file = formData.get('file') as File;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File exceeds 2 MB limit.');
      }
      name = file.name;
      textToProcess = await file.text();
    }
    else if (type === 'url') {
      url = formData.get('url') as string;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      $('script, style').remove();
      textToProcess = $('body').text().replace(/\s+/g, ' ').trim();
    }
    else if (type === 'youtube') {
      url = formData.get('url') as string;
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      textToProcess = transcript.map(t => t.text).join(' ');
    }

    if (!textToProcess) {
       throw new Error('No content extracted');
    }

    // Limit the text to avoid abuse
    if (textToProcess.length > MAX_TEXT_LENGTH) {
      textToProcess = textToProcess.substring(0, MAX_TEXT_LENGTH);
    }

    await processAndEmbed(textToProcess, sourceId, notebookId, (i) => ({ sourceName: name, chunkIndex: i }));

    await db.update(sources).set({ status: 'ready', name, url }).where(eq(sources.id, sourceId));
    
    return NextResponse.json({ success: true, sourceId });
  } catch (error: any) {
    console.error('Source processing error:', error);
    await db.update(sources).set({ status: 'error' }).where(eq(sources.id, sourceId));
    return NextResponse.json({ error: error?.message || 'Processing failed' }, { status: 400 });
  }
}
