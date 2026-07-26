import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string) {
    return JSON.parse(value);
  },
});

export const notebooks = pgTable('notebooks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: text('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sources = pgTable('sources', {
  id: varchar('id', { length: 255 }).primaryKey(),
  notebookId: varchar('notebook_id', { length: 255 }).references(() => notebooks.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  url: text('url'), 
  status: varchar('status', { length: 50 }).notNull().default('uploading'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sourceId: varchar('source_id', { length: 255 }).references(() => sources.id, { onDelete: 'cascade' }).notNull(),
  notebookId: varchar('notebook_id', { length: 255 }).references(() => notebooks.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  metadata: text('metadata').notNull(),
  embedding: vector('embedding', { dimensions: 1536 })
});
