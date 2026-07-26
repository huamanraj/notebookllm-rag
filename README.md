# ChaiBook - AI Research Assistant

An AI-powered research assistant inspired by Gemini Notebook that allows users to upload multiple knowledge sources, ask questions grounded in those sources, and receive answers with proper citations.

## Features

- **Multiple Notebooks**: Create and manage multiple isolated knowledge bases.
- **Source Ingestion**: Upload PDF, Text, Web URLs, and YouTube videos.
- **RAG Pipeline**: Fully functional Retrieval-Augmented Generation using LangChain, OpenAI, and pgvector.
- **Grounding and Citations**: All answers cite the specific chunks they were sourced from.
- **Modern UI**: Dark-mode only responsive UI built with Next.js App Router, TailwindCSS v4, and Shadcn UI.
- **Authentication**: Seamless Google Auth provided by better-auth.
- **State Management**: Zustand for managing notebooks state on the client side.

## Setup Instructions

1. **Install dependencies**:
   \`\`\`bash
   bun install
   \`\`\`

2. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in the following:
   - `DATABASE_URL`: A PostgreSQL connection string (must have `pgvector` extension installed).
   - `OPENAI_API_KEY`: Your OpenAI API Key.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials for Authentication.
   - `BETTER_AUTH_SECRET`: A secure random string.
   - `NEXT_PUBLIC_APP_URL`: Your app's base URL (e.g. `http://localhost:3000`).

3. **Database Migration**:
   We use Drizzle ORM. Ensure your Postgres database has the `pgvector` extension enabled. 
   Generate and push the schema:
   \`\`\`bash
   bunx drizzle-kit push
   \`\`\`

4. **Run the Application**:
   \`\`\`bash
   bun run dev
   \`\`\`

## Architecture & Code Quality

- **Database**: Drizzle ORM connected to PostgreSQL. `schema.ts` defines all tables (`users`, `notebooks`, `sources`, `documents`). We use a custom vector type for embeddings.
- **Authentication**: `better-auth` simplifies Google OAuth, keeping session logic separate and clean.
- **RAG Implementation**: 
  - On upload, documents are parsed depending on type (`pdf-parse`, `cheerio`, `youtube-transcript`).
  - LangChain `RecursiveCharacterTextSplitter` chunks the text.
  - Vercel AI SDK `embedMany` generates embeddings using `text-embedding-3-small`.
  - Embeddings are stored in Postgres using `pgvector`.
- **Chat**: 
  - Next.js API Route uses vector similarity search in SQL to fetch Top-5 relevant chunks.
  - `streamText` from Vercel AI SDK streams the response with `gpt-4o-mini`, appending a strict system prompt to always cite sources.

## Important Note for Vector DB
When setting up PostgreSQL, you must enable the vector extension:
\`\`\`sql
CREATE EXTENSION IF NOT EXISTS vector;
\`\`\`
