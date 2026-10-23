module.exports = {
  apps: [{
    name: 'ranzzxiter',
    script: './src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '127.0.0.1',
      ENABLE_CLOUDFLARE_TUNNEL: 'true'
    },
    error_file: './logs/ranzzxiter-error.log',
    out_file: './logs/ranzzxiter-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};
