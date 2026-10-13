import { pgTable, uuid, varchar, numeric, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { wallets } from './wallets';
import { referrals } from './referrals';

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  referralId: uuid('referral_id').references(() => referrals.id, { onDelete: 'set null' }),
  transactionType: varchar('transaction_type', { length: 30 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  feeDeducted: numeric('fee_deducted', { precision: 12, scale: 2 }).default('0'),
  balanceBefore: numeric('balance_before', { precision: 12, scale: 2 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
