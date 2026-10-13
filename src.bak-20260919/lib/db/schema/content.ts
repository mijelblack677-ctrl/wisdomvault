import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const contentCategories = pgTable('content_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  iconSvg: text('icon_svg'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const contentItems = pgTable('content_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).unique().notNull(),
  description: text('description'),
  contentType: varchar('content_type', { length: 30 }).notNull(),
  fileUrl: text('file_url'),
  thumbnailUrl: text('thumbnail_url'),
  author: varchar('author', { length: 255 }),
  isFeatured: boolean('is_featured').default(false),
  isPublished: boolean('is_published').default(false),
  viewCount: integer('view_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
