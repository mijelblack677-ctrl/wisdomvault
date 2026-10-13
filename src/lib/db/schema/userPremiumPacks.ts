import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { premiumPacks } from './premiumPacks';

export const userPremiumPacks = pgTable('user_premium_packs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  packId: uuid('pack_id')
    .notNull()
    .references(() => premiumPacks.id, { onDelete: 'cascade' }),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow(),
  amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull(),
  transactionRef: varchar('transaction_ref', { length: 255 }),
});
