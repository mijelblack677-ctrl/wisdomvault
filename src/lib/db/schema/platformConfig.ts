import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const platformConfig = pgTable('platform_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  configKey: varchar('config_key', { length: 100 }).unique().notNull(),
  configValue: text('config_value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
