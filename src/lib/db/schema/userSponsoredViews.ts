import { pgTable, uuid, numeric, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { sponsoredContent } from './sponsoredContent';

export const userSponsoredViews = pgTable('user_sponsored_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id')
    .notNull()
    .references(() => sponsoredContent.id, { onDelete: 'cascade' }),
  watchedAt: timestamp('watched_at', { withTimezone: true }).defaultNow(),
  rewardEarned: numeric('reward_earned', { precision: 10, scale: 2 }).notNull(),
  watchedDate: date('watched_date').defaultNow(),
});
