import { pgTable, uuid, varchar, boolean, integer, date, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 50 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  referralCode: varchar('referral_code', { length: 50 }).unique().notNull(),
  referredBy: uuid('referred_by'),
  isFoundingMember: boolean('is_founding_member').default(false),
  foundingMemberNumber: integer('founding_member_number'),
  registrationYear: integer('registration_year').notNull(),
  renewalDueDate: date('renewal_due_date').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
