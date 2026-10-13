import { pgTable, uuid, varchar, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { premiumPacks } from './premiumPacks';
import { adminUsers } from './adminUsers';

export const paymentProofs = pgTable('payment_proofs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  packId: uuid('pack_id')
    .notNull()
    .references(() => premiumPacks.id, { onDelete: 'cascade' }),
  providerName: varchar('provider_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  cardName: varchar('card_name', { length: 255 }),
  amountSent: numeric('amount_sent', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
