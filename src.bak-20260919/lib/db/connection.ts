// src/lib/db/connection.ts
// Lazy-initialized postgres client — connection is created on first use, not at import time.
// This is critical for Vercel serverless where process.env is only available at runtime.
import postgres from 'postgres';

let _client: any = null;

function initClient() {
  if (_client) return _client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not available');
    return null;
  }

  _client = postgres(connectionString, {
    max: parseInt(process.env.DB_POOL_SIZE || '10'),
    idle_timeout: 30,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    ssl: {
      rejectUnauthorized: false,
    },
    prepare: false,
  });

  return _client;
}

// Export a proxy that lazily initializes the postgres client.
// postgres() returns a tagged-template function, so the proxy must
// forward calls AND property access to the real client.
export const client: any = new Proxy(
  function () {} as any,
  {
    // Handle tagged template calls: client`SELECT ...`
    apply(_target, _thisArg, args) {
      const sql = initClient();
      if (!sql) throw new Error('Database not available');
      return sql(...args);
    },
    // Handle property access: client.begin, client.query, etc.
    get(_target, prop) {
      if (prop === Symbol.toPrimitive) return undefined;
      const sql = initClient();
      if (!sql) {
        // Build-time fallback mock
        if (prop === 'begin') return async (cb: any) => cb({ query: async () => [] });
        if (prop === 'query') return async () => ({ rows: [] });
        if (prop === 'end') return async () => {};
        return undefined;
      }
      const val = sql[prop];
      if (typeof val === 'function') return val.bind(sql);
      return val;
    },
  }
);

export let db: any = null;

export async function closeDatabase() {
  if (_client && typeof _client.end === 'function') {
    await _client.end();
  }
}

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});
