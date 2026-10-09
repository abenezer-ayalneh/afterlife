module.exports = {
  apps: [{
    name: 'afterlife-staging',
    cwd: '/home/richard/afterlife',
    script: 'scripts/start.mjs',
    interpreter: process.execPath,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    restart_delay: 5000,
    max_memory_restart: '640M',
    kill_timeout: 10000,
    out_file: '/home/richard/afterlife/.logs/pm2-out.log',
    error_file: '/home/richard/afterlife/.logs/pm2-error.log',
    node_args: '--max-old-space-size=512 --env-file=/home/richard/afterlife/.env.staging',
    env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '4321' },
  }],
};
