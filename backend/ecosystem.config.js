module.exports = {
  apps: [
    {
      name: 'bolna-backend',
      script: 'index.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};
