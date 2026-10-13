import { pgTable, uuid, varchar, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  referrerId: uuid('referrer_id').notNull(),
  referredId: uuid('referred_id').notNull(),
  referralType: varchar('referral_type', { length: 20 }).notNull(),
  registrationYear: integer('registration_year').notNull(),
  bonusAmount: numeric('bonus_amount', { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean('is_paid').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
