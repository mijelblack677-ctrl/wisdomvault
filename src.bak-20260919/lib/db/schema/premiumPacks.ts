import { pgTable, uuid, varchar, text, numeric, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const premiumPacks = pgTable('premium_packs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  longDescription: text('long_description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  iconSvg: text('icon_svg'),
  thumbnailUrl: text('thumbnail_url'),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
