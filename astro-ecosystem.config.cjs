module.exports = {
  apps: [
    {
      name: 'wisdom-vault',
      script: '/home/miracle/app/start-astro.sh',
      cwd: '/home/miracle/app',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '4321'
      }
    }
  ]
};
