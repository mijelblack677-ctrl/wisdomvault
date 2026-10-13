import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://wisdom_vault:WisdomVault2026!@localhost:5432/wisdom_vault',
  },
} satisfies Config;
