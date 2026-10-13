// scripts/run-migrations.mjs
import { spawn } from 'child_process';

const env = { ...process.env };
env.DATABASE_URL = env.DATABASE_URL || 'postgres://wisdom_vault:ab0968aa54a5690656104ec36076b763@127.0.0.1:5432/wisdom_vault';
env.NODE_ENV = env.NODE_ENV || 'production';

console.log('Running migrations (DATABASE_URL present?:', !!env.DATABASE_URL, ')');

const child = spawn('npx', ['drizzle-kit', 'migrate'], {
  stdio: 'inherit',
  env,
});

child.on('close', (code) => process.exit(code));
child.on('error', (err) => {
  console.error('Migration process failed:', err);
  process.exit(1);
});
