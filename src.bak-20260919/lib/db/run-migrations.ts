// src/lib/db/run-migrations.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  console.log('📦 Running migrations...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  // ✅ Use a larger pool for migrations
  const sql = postgres(connectionString, { 
    max: 10, // ← Increased from 1
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === 'production' 
  });
  
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  await sql.end();
  process.exit(0);
}

main();