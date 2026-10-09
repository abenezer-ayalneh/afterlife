module.exports = {
  apps: [{
    name: 'afterlife-staging',
    cwd: '/opt/afterlife/current',
    script: 'scripts/start.mjs',
    interpreter: process.execPath,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    restart_delay: 5000,
    max_memory_restart: '640M',
    kill_timeout: 10000,
    node_args: '--max-old-space-size=512 --env-file=/etc/afterlife/afterlife.env',
    env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '4321' },
  }],
};
