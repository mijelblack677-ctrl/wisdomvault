import { pgTable, uuid, varchar, text, numeric, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const sponsoredContent = pgTable('sponsored_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  contentType: varchar('content_type', { length: 20 }).notNull(),
  fileUrl: text('file_url'),
  thumbnailUrl: text('thumbnail_url'),
  sponsorName: varchar('sponsor_name', { length: 255 }),
  rewardAmount: numeric('reward_amount', { precision: 10, scale: 2 }).default('50').notNull(),
  durationSeconds: integer('duration_seconds').default(30),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  externalLink: text('external_link'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
