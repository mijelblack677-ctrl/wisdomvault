// scripts/start-server.mjs
process.env.HOST = process.env.HOST || '0.0.0.0';
process.env.PORT = process.env.PORT || '8080';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`Starting server: HOST=${process.env.HOST} PORT=${process.env.PORT} NODE_ENV=${process.env.NODE_ENV}`);

import('../dist/server/entry.mjs')
  .then(() => {
    console.log('Server entry imported successfully.');
  })
  .catch((err) => {
    console.error('Failed to start server entry:', err);
    process.exit(1);
  });
