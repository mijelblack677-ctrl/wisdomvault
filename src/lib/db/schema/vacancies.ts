import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Job vacancies published by the admin ("Vacancies" in the More panel,
// right after My Advert). No user submissions — admin-only publishing.
// The description is unlimited (TEXT, no length cap by design).
// Lifecycle: active <-> closed (admin toggle); deletion removes images.
export const vacancies = pgTable('vacancies', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 120 }).notNull(),
  company: varchar('company', { length: 100 }).notNull(),
  description: text('description'), // unlimited by design
  location: varchar('location', { length: 150 }),
  contactPhone: varchar('contact_phone', { length: 40 }),
  whatsapp: varchar('whatsapp', { length: 40 }),
  imageUrls: text('image_urls').notNull().default('[]'), // JSON array, max 3

  isActive: boolean('is_active').default(true).notNull(),
  viewCount: integer('view_count').default(0).notNull(),

  createdBy: uuid('created_by'), // admin_users.id
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('vacancies_active_idx')
    .on(table.createdAt)
    .where(sql`is_active = true`),
]);

export type Vacancy = typeof vacancies.$inferSelect;
export type NewVacancy = typeof vacancies.$inferInsert;
