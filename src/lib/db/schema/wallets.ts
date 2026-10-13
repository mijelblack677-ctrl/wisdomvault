import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';

export const wallets = pgTable('wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').unique().notNull(),
  grossEarnings: numeric('gross_earnings', { precision: 12, scale: 2 }).default('0.00'),
  totalWithdrawn: numeric('total_withdrawn', { precision: 12, scale: 2 }).default('0.00'),
  balanceAvailable: numeric('balance_available', { precision: 12, scale: 2 }).default('0.00'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
