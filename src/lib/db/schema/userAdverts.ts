import { pgTable, uuid, varchar, text, boolean, timestamp, date, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// User-submitted business adverts ("My Advert" in the More panel).
// Lifecycle: pending -> approved | rejected (admin moderation required).
// One submission per user per day, enforced by the unique index below.
export const userAdverts = pgTable('user_business_adverts', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Null for admin-created "official" ads (they have no user owner);
  // always set for real user submissions.
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),

  // Fill-in template system
  template: varchar('template', { length: 30 }).notNull(), // 'standard' | 'promotion' | 'grand-opening' | 'hiring'
  headline: varchar('headline', { length: 120 }).notNull(),
  businessName: varchar('business_name', { length: 100 }).notNull(),
  description: text('description'), // optional
  contactPhone: varchar('contact_phone', { length: 40 }),
  location: varchar('location', { length: 150 }),
  whatsapp: varchar('whatsapp', { length: 40 }),
  imageUrls: text('image_urls').notNull().default('[]'), // JSON array, max 3

  // Moderation
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | approved | rejected
  reviewedBy: uuid('reviewed_by'), // admin_users.id
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),

  isActive: boolean('is_active').default(true).notNull(),
  viewCount: integer('view_count').default(0).notNull(),

  // Admin-placed "official" ads: auto-approved, exempt from the daily limit,
  // labeled OFFICIAL in the feed. Not tied to a real user account.
  isOfficial: boolean('is_official').default(false).notNull(),
  // Business transacted — owner toggles from My Advert; ad stays listed with
  // a SOLD banner.
  sold: boolean('sold').default(false).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  // UTC date of submission — powers the one-advert-per-day rule
  createdDate: date('created_date'),
}, (table) => [
  // One advert per user per day (DB-level; the API also pre-checks for a
  // nicer error). User submissions only — official admin ads are exempt.
  uniqueIndex('user_adverts_one_per_day_idx')
    .on(table.userId, table.createdDate)
    .where(sql`is_official = false`),
  index('user_adverts_user_idx').on(table.userId),
  index('user_adverts_status_idx').on(table.status, table.createdAt),
  index('user_adverts_feed_idx')
    .on(table.createdAt)
    .where(sql`status = 'approved' AND is_active = true`),
]);

export type UserAdvert = typeof userAdverts.$inferSelect;
export type NewUserAdvert = typeof userAdverts.$inferInsert;
