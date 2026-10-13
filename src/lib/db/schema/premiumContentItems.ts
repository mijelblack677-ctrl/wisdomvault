import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { premiumPacks } from './premiumPacks';

export const premiumContentItems = pgTable('premium_content_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  packId: uuid('pack_id')
    .notNull()
    .references(() => premiumPacks.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  contentType: varchar('content_type', { length: 30 }).notNull(),
  fileUrl: text('file_url'),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
