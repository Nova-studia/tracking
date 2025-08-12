module.exports = {
  apps: [
    {
      name: 'tracking-app',
      script: './node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/tracking',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/tracking-app-error.log',
      out_file: '/var/log/pm2/tracking-app-out.log',
      log_file: '/var/log/pm2/tracking-app-combined.log'
    }
  ]
};