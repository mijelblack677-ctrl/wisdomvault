// PM2 config for Wisdom Vault standalone on the VPS.
// Loads all runtime env vars from ~/app/.env via Node's --env-file (Node 22+).
// Start/restart with:  pm2 start ~/app/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'wisdomvault',
      script: 'dist/server/entry.mjs',
      cwd: '/home/miracle/app',
      node_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        HOST: '127.0.0.1',
        PORT: '4321',
      },
    },
  ],
};
