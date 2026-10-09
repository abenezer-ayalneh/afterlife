# Minimal VPS deployment checklist

Target: `afterlife.abenezer-ayalneh.dev` → `68.178.201.176` (GoDaddy Ubuntu, 2 GB RAM). The code is already downloaded and built in `/home/richard/afterlife`. Use the existing `richard` deployment account, Node **22.19**, PM2, Nginx, and Certbot. Node runs directly on the VPS; SQLite is embedded, so no database service or Docker container is required. This checklist prepares staging; production follows your review.

1. [ ] **Confirm the existing tools and a free application port.** Run these as the same account that manages your other PM2 apps. Keep its existing PM2 home and startup configuration. Install only something actually missing; do not upgrade the shared Node installation.

   ```sh
   node --version
   command -v node
   pm2 list
   nginx -v
   certbot --version
   sudo ss -ltnp | rg ':4321\b'
   ```

   Node 22.19 has passed the app's 22 tests and built-server checks. Its SQLite experimental warning is expected. Port 4321 must be free; if occupied, choose a free port and change it in the environment file, PM2 template, and Nginx `proxy_pass`. If `rg` is unavailable, use `grep` for this check.

2. [ ] **Point the staging hostname at the VPS.** At your DNS provider, set its A record to `68.178.201.176`. Keep this hostname **DNS only** permanently and wait for DNS to resolve to that IP. Remove a conflicting AAAA record unless this VPS also has working IPv6. The bootstrap site below exposes only the certificate challenge, not the application.

3. [ ] **Confirm the existing build targets the staging hostname.** Work directly in the downloaded project:

   ```sh
   cd /home/richard/afterlife
   npm ci
   npm run build:staging
   ```

   Rebuild after downloading these local-authentication changes; an earlier build still contains the old authentication code. `build:staging` also ensures Astro trusts the staging hostname instead of the development default. Once this updated code is built for staging, reuse that build. No release archive or second checkout is needed. Optional verification: `npm run smoke`.

4. [ ] **Create private database and log directories in the project.** Run as `richard`, not through `sudo`:

   ```sh
   cd /home/richard/afterlife
   umask 077
   mkdir -p .data .logs
   chmod 700 .data .logs
   ```

   The staging database lives at `.data/staging.sqlite`; PM2 and Nginx logs live in `.logs/`. These directories and `.env.staging` are ignored by Git. Keep them when updating code; do not remove/recreate the whole project directory. Nginx source configs remain in `deploy/nginx/` and PM2's config remains in `deploy/ecosystem.config.cjs`. Certificates stay in Certbot's managed `/etc/letsencrypt/` directory; the ACME challenge directory stays in `/var/www/letsencrypt` so Nginx workers can read it without opening access to your home directory.

5. [ ] **Fill in the staging environment file.** Run from `/home/richard/afterlife`:

   ```sh
   test -e .env.staging || install -m 0600 deploy/staging.env.example .env.staging
   nano .env.staging
   ```

   Keep `APP_ENV=staging`, `PUBLIC_ORIGIN=https://afterlife.abenezer-ayalneh.dev`, `DATABASE_PATH=/home/richard/afterlife/.data/staging.sqlite`, `HOST=127.0.0.1`, and `PORT=4321`. Supply a random `RATE_LIMIT_SALT` generated with `openssl rand -hex 32`. The file uses dotenv syntax and is loaded by Node's `--env-file`; do not source it as a shell script or include it in release archives. Do not overwrite it on subsequent updates.

6. [ ] **Use local administrator accounts and local submission protection.** Keep exactly the two emails from the template: `abenezer.ayalneh.42@gmail.com` and `boersarama@gmail.com`. They have equal permissions. The application handles passwords and sessions, signed forms, invisible honeypots, and reader/network submission limits. Administrator credentials are managed locally with the password command below. These spam controls do not prove a visitor is human. If older configuration exists, remove this hostname's old external authentication and proxy/cache rules; do not change other apps or zone-wide settings.

7. [ ] **Validate configuration, migrate SQLite, and start this app in PM2.** Use the existing deployment account and PM2 installation:

   ```sh
   cd /home/richard/afterlife
   umask 077
   node --env-file=/home/richard/afterlife/.env.staging scripts/preflight.mjs staging
   node --env-file=/home/richard/afterlife/.env.staging scripts/database.mjs migrate
   node --env-file=/home/richard/afterlife/.env.staging scripts/admin-account.mjs abenezer.ayalneh.42@gmail.com
   node --env-file=/home/richard/afterlife/.env.staging scripts/admin-account.mjs boersarama@gmail.com
   node --env-file=/home/richard/afterlife/.env.staging scripts/preflight.mjs staging --ready
   pm2 start deploy/ecosystem.config.cjs
   pm2 save
   node --env-file=/home/richard/afterlife/.env.staging scripts/healthcheck.mjs
   ```

   Each account command privately prompts for a password twice (at least 12 characters, at most 128 UTF-8 bytes); passwords are not command arguments. Use separate strong passwords. Startup requires both accounts. To reset a password later, run the same account command; it revokes that account’s existing sessions. Sign in at `/admin/login`; sessions expire after 12 hours.

   The template uses the Node executable running PM2, one fork process, and a 512 MB heap limit. Confirm PM2 uses the intended Node 22.19 binary. Reuse existing PM2 reboot persistence; do not create a second PM2 daemon or rerun server-wide startup setup if it already works. For an existing `afterlife-staging` process, use `pm2 restart deploy/ecosystem.config.cjs --update-env` instead of starting a duplicate. Migration reruns are safe; staging starts with fresh data and all eleven chapters.

8. [ ] **Add only this hostname's HTTP Nginx site.** Check `sudo nginx -T` for an existing hostname/site conflict first. Do not replace other apps or disable the default site. The usual Ubuntu `sites-enabled` include is assumed.

   ```sh
   sudo mkdir -p /var/www/letsencrypt
   sudo ln -s /home/richard/afterlife/deploy/nginx/afterlife-http.conf /etc/nginx/sites-enabled/afterlife
   sudo nginx -t
   sudo systemctl reload nginx
   ```

   If the symlink already exists, inspect it first and update it only if it belongs to this app. The config stays in the project; `/etc/nginx/sites-enabled/afterlife` is only a symlink. Ensure port 80 is reachable for this hostname, using the server's existing firewall rules. The HTTP bootstrap returns 404 outside `/.well-known/acme-challenge/`.

9. [ ] **Issue a Let's Encrypt certificate with the existing Certbot.**

   ```sh
   sudo certbot certonly --webroot -w /var/www/letsencrypt \
     --cert-name afterlife.abenezer-ayalneh.dev \
     -d afterlife.abenezer-ayalneh.dev
   ```

   Use the existing Certbot account when prompted. This obtains the certificate without rewriting other Nginx sites. The [Certbot webroot method](https://eff-certbot.readthedocs.io/en/stable/using.html#webroot) requires a publicly reachable HTTP challenge path; leave that path accessible for renewals.

10. [ ] **Enable this site's HTTPS proxy.** The final template uses Certbot's `fullchain.pem` and `privkey.pem`, preserves the HTTP challenge path, and redirects other HTTP requests to HTTPS.

    ```sh
    sudo ln -sfn /home/richard/afterlife/deploy/nginx/afterlife.conf /etc/nginx/sites-enabled/afterlife
    sudo nginx -t
    sudo systemctl reload nginx
    ```

    Keep DNS **DNS only**. Nginx sends the fixed canonical host and HTTPS scheme to the loopback Node service. Its `X-Real-IP` uses the original socket peer (`$realip_remote_addr`), so visitor-supplied forwarded headers cannot choose a rate-limit identity. Nginx's root master reads these project config files; do not use the project as a static web root. Remove obsolete peer-restriction includes only after confirming they belong to this app. Inspect inherited `nginx -T` settings before changing anything. Keep port 4321 private and HTML/API/admin responses uncached.

11. [ ] **Check HTTPS, renewal, and reader/admin flows.** Run:

    ```sh
    curl -fsS https://afterlife.abenezer-ayalneh.dev/health
    pm2 logs afterlife-staging --lines 50 --nostream
    sudo certbot renew --cert-name afterlife.abenezer-ayalneh.dev --dry-run
    ```

    Reuse the existing Certbot renewal scheduler. Ensure successful renewal reloads Nginx using the server's existing deploy hook; if none exists, configure `systemctl reload nginx` as the renewal deploy hook. The dry run must pass with DNS-only routing. Confirm all eleven chapter pages, a zero rating and its revision, comment create/edit/delete, reports, both real administrator logins, moderation and CSV exports. Check missing/tampered form tokens, filled honeypots, wrong passwords, expired sessions and unauthorized administrator requests are rejected. Port 4321 stays bound to loopback; direct requests to the Node port are inaccessible remotely. Review the working staging site before production launch.

12. [ ] **Update in place using your existing deployment workflow.** Take a manual database backup first, keep the previous code revision, and stop only this app before pulling/uploading new code. Preserve `.data/`, `.logs/`, and `.env.staging`:

    ```sh
    cd /home/richard/afterlife
    pm2 stop afterlife-staging
    # Pull/upload the new code here using your normal workflow.
    npm ci
    npm run build:staging
    node --env-file=/home/richard/afterlife/.env.staging scripts/preflight.mjs staging
    node --env-file=/home/richard/afterlife/.env.staging scripts/database.mjs migrate
    node --env-file=/home/richard/afterlife/.env.staging scripts/preflight.mjs staging --ready
    pm2 restart deploy/ecosystem.config.cjs --update-env
    node --env-file=/home/richard/afterlife/.env.staging scripts/healthcheck.mjs
    pm2 save
    ```

    If Nginx config files changed, run `sudo nginx -t` before `sudo systemctl reload nginx`; its symlinks point at these project files. If an update fails, restore the previous code revision before restarting. Code rollback does not undo database migrations; use a compatible code release or a verified backup. Do not delete the environment file or database when replacing code.

13. [ ] **Make a manual backup when you need one.** There are no automated database backups. Use a new destination filename each time:

    ```sh
    cd /home/richard/afterlife
    umask 077
    node scripts/database.mjs backup /home/richard/afterlife/.data/staging.sqlite /home/richard/afterlife/.data/staging-backup-2026-10-09.sqlite
    node scripts/database.mjs check /home/richard/afterlife/.data/staging-backup-2026-10-09.sqlite
    ```

    The SQLite backup API handles active WAL writes safely; do not copy just the live database file. Store/download backups using your existing workflow. To restore, stop only `afterlife-staging`, copy a verified backup into a fresh directory such as `/home/richard/afterlife/.data/recovery-2026-10-09/staging.sqlite`, check it, change `DATABASE_PATH` to that file, then run preflight and restart. Keep the old database and its WAL/SHM files together; never overwrite a running database. CSV exports are not database backups. Backups contain password hashes and administrator sessions; protect them like the live database. After recovery, reset both administrator passwords to revoke restored sessions.

14. [ ] **Use Docker maintenance tools only if useful.** Native Node already provides SQLite, so this is optional. Build `Dockerfile.tools` wherever convenient for the VPS architecture, then mount the project’s `.data/` directory using your existing account's UID/GID:

    ```sh
    docker build --platform linux/amd64 -f Dockerfile.tools -t afterlife-sqlite-tools:2026-10-09 .
    ```

    Run on the VPS (transfer/load the image first only if you built it elsewhere):

    ```sh
    docker run --rm --network none --user "$(id -u):$(id -g)" \
      -v /home/richard/afterlife/.data:/data \
      afterlife-sqlite-tools:2026-10-09 check /data/staging.sqlite
    ```

    Use your usual Docker permissions (`sudo docker` if necessary). No container needs to stay running. Native migration/backup commands above remain the minimal path.

15. [ ] **Keep production separate until launch is approved.** The temporary hostname and its responses are staging. Production requires the final domain, a rebuild for that origin, matching Nginx/Certbot settings, newly created local administrator accounts, and a clean `/home/richard/afterlife/.data/production.sqlite`. Do not import local or staging responses. Generate permanent book links after approval. Reader ownership cookies do not transfer when the hostname changes.
