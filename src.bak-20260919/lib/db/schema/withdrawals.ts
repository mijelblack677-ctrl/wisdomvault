import { pgTable, uuid, numeric, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').notNull(),
  amountRequested: numeric('amount_requested', { precision: 12, scale: 2 }).notNull(),
  withdrawalFee: numeric('withdrawal_fee', { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  processedBy: uuid('processed_by'),
  notes: text('notes'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
