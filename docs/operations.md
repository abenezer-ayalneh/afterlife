# Minimal VPS deployment checklist

Target: `afterlife.abenezer-ayalneh.dev` → `68.178.201.176` (GoDaddy Ubuntu, 2 GB RAM). Use your existing deployment account, Node **22.19**, PM2, Nginx, and Certbot. Node runs directly on the VPS; SQLite is embedded, so no database service or Docker container is required. This checklist prepares staging; production follows your review.

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

2. [ ] **Point the staging hostname at the VPS.** In Cloudflare, set its A record to `68.178.201.176`. For first certificate issuance, temporarily use **DNS only** for this hostname and wait for DNS to resolve to that IP. Remove a conflicting AAAA record unless this VPS also has working IPv6. The bootstrap site below exposes only the certificate challenge, not the application.

3. [ ] **Build and package the app locally.** Build off the 2 GB VPS; the server does not need build tools or development dependencies.

   ```sh
   npm ci
   npm test
   npm run build:staging
   npm run smoke
   npm run package:release -- /absolute/path/afterlife-staging.tar.gz
   ```

   Transfer the archive to the VPS with your usual SCP/SFTP workflow. It contains the built application, migrations and deployment templates, without secrets, responses or `node_modules`.

4. [ ] **Create the app paths using your existing account.** These commands assume the paths are new; reuse existing suitable paths rather than changing their ownership blindly. No dedicated user is needed.

   ```sh
   sudo install -d -o "$(id -un)" -g "$(id -gn)" -m 0755 /opt/afterlife/current
   sudo install -d -o "$(id -un)" -g "$(id -gn)" -m 0700 /var/lib/afterlife /etc/afterlife
   tar -xzf /path/to/afterlife-staging.tar.gz -C /opt/afterlife/current
   cd /opt/afterlife/current
   npm ci --omit=dev
   ```

   Keep the database and environment outside the app directory so code updates preserve them. Install dependencies on Ubuntu rather than copying macOS dependencies.

5. [ ] **Fill in the staging environment file.** Run from `/opt/afterlife/current`:

   ```sh
   install -m 0600 deploy/staging.env.example /etc/afterlife/afterlife.env
   nano /etc/afterlife/afterlife.env
   ```

   Keep `APP_ENV=staging`, `PUBLIC_ORIGIN=https://afterlife.abenezer-ayalneh.dev`, `DATABASE_PATH=/var/lib/afterlife/staging.sqlite`, `HOST=127.0.0.1`, and `PORT=4321`. Supply the real Access team/audience, Turnstile site/secret keys, and a random `RATE_LIMIT_SALT` generated with `openssl rand -hex 32`. The file uses dotenv syntax and is loaded by Node's `--env-file`; do not source it as a shell script or include it in release archives. Do not overwrite it on subsequent updates.

6. [ ] **Configure the retained Cloudflare login and spam protection.** Protect both `/admin` and `/admin/*` with Access email codes, allowing exactly `abenezer.ayalneh.42@gmail.com` and `boersarama@gmail.com`. Both administrators have equal permissions. Authorize the exact staging hostname in Turnstile, then enter those settings in the environment file. The app independently verifies Access JWTs and Turnstile tokens; missing configuration blocks staging startup.

7. [ ] **Validate configuration, migrate SQLite, and start this app in PM2.** Use the existing deployment account and PM2 installation:

   ```sh
   cd /opt/afterlife/current
   umask 077
   node --env-file=/etc/afterlife/afterlife.env scripts/preflight.mjs staging
   node --env-file=/etc/afterlife/afterlife.env scripts/database.mjs migrate
   pm2 start deploy/ecosystem.config.cjs
   pm2 save
   node --env-file=/etc/afterlife/afterlife.env scripts/healthcheck.mjs
   ```

   The template uses the Node executable running PM2, one fork process, and a 512 MB heap limit. Confirm PM2 uses the intended Node 22.19 binary. Reuse existing PM2 reboot persistence; do not create a second PM2 daemon or rerun server-wide startup setup if it already works. For an existing `afterlife-staging` process, use `pm2 restart deploy/ecosystem.config.cjs --update-env` instead of starting a duplicate. Migration reruns are safe; staging starts with fresh data and all eleven chapters.

8. [ ] **Add only this hostname's HTTP Nginx site.** Check `sudo nginx -T` for an existing hostname/site conflict first. Do not replace other apps or disable the default site. The usual Ubuntu `sites-enabled` include is assumed.

   ```sh
   sudo mkdir -p /var/www/letsencrypt
   sudo cp deploy/nginx/afterlife-http.conf /etc/nginx/sites-available/afterlife
   sudo ln -s /etc/nginx/sites-available/afterlife /etc/nginx/sites-enabled/afterlife
   sudo nginx -t
   sudo systemctl reload nginx
   ```

   If the symlink already exists, inspect/reuse it. Ensure port 80 is reachable for this hostname, using the server's existing firewall rules. The HTTP bootstrap returns 404 outside `/.well-known/acme-challenge/`.

9. [ ] **Issue a Let's Encrypt certificate with the existing Certbot.** No Cloudflare Origin CA certificate is needed.

   ```sh
   sudo certbot certonly --webroot -w /var/www/letsencrypt \
     --cert-name afterlife.abenezer-ayalneh.dev \
     -d afterlife.abenezer-ayalneh.dev
   ```

   Use the existing Certbot account when prompted. This obtains the certificate without rewriting other Nginx sites. The [Certbot webroot method](https://eff-certbot.readthedocs.io/en/stable/using.html#webroot) requires a publicly reachable HTTP challenge path; leave that path accessible for renewals.

10. [ ] **Enable this site's HTTPS proxy and restore Cloudflare proxying.** The final template uses Certbot's `fullchain.pem` and `privkey.pem`, preserves the HTTP challenge path, and redirects other HTTP requests to HTTPS.

    ```sh
    sudo install -d -m 0755 /etc/nginx/afterlife
    sudo cp deploy/nginx/cloudflare-networks.conf /etc/nginx/afterlife/cloudflare-networks.conf
    sudo cp deploy/nginx/cloudflare-peer.conf /etc/nginx/conf.d/afterlife-cloudflare-peer.conf
    sudo cp deploy/nginx/afterlife.conf /etc/nginx/sites-available/afterlife
    sudo nginx -t
    sudo systemctl reload nginx
    ```

    Confirm `conf.d/*.conf` is included inside Nginx's `http` context. Refresh the bundled CIDRs against Cloudflare's [IPv4](https://www.cloudflare.com/ips-v4) and [IPv6](https://www.cloudflare.com/ips-v6) lists before installation. These includes keep this HTTPS site behind Cloudflare and normalize client addresses; they do not change other sites' trust rules.

    Set the hostname back to **Proxied** in Cloudflare and use **Full (strict)** TLS, which accepts Let's Encrypt certificates. [Cloudflare TLS requirements](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/) Inspect the existing zone setting before changing it because other apps may share that zone. If there are Cloudflare redirect/WAF rules, ensure they leave `/.well-known/acme-challenge/*` reachable over HTTP. Access should protect only administrator paths. Keep HTML/API/admin responses uncached.

11. [ ] **Check HTTPS, renewal, and reader/admin flows.** Run:

    ```sh
    curl -fsS https://afterlife.abenezer-ayalneh.dev/health
    pm2 logs afterlife-staging --lines 50 --nostream
    sudo certbot renew --cert-name afterlife.abenezer-ayalneh.dev --dry-run
    ```

    Reuse the existing Certbot renewal scheduler. Ensure successful renewal reloads Nginx using the server's existing deploy hook; if none exists, configure `systemctl reload nginx` as the renewal deploy hook. The dry run must pass with Cloudflare proxying enabled. Confirm all eleven chapter pages, a zero rating and its revision, comment create/edit/delete, reports, both real administrator logins, moderation and CSV exports. Check missing/invalid Turnstile tokens and unauthorized administrator requests are rejected. Port 4321 stays bound to loopback; direct HTTPS origin requests are denied. Review the working staging site before production launch.

12. [ ] **Use this short update procedure for later releases.** Keep a copy of the previous app code and take a manual database backup before updates. Stop only this app, extract the new archive into its app directory, and run:

    ```sh
    cd /opt/afterlife/current
    pm2 stop afterlife-staging
    npm ci --omit=dev
    node --env-file=/etc/afterlife/afterlife.env scripts/preflight.mjs staging
    node --env-file=/etc/afterlife/afterlife.env scripts/database.mjs migrate
    pm2 restart deploy/ecosystem.config.cjs --update-env
    node --env-file=/etc/afterlife/afterlife.env scripts/healthcheck.mjs
    pm2 save
    ```

    If an update fails, restore the previous code before restarting. Code rollback does not undo database migrations; use a compatible code release or a verified backup. Do not delete the environment file or database when replacing code.

13. [ ] **Make a manual backup when you need one.** There are no automated database backups. Use a new destination filename each time:

    ```sh
    cd /opt/afterlife/current
    umask 077
    node scripts/database.mjs backup /var/lib/afterlife/staging.sqlite /var/lib/afterlife/staging-backup-2026-10-09.sqlite
    node scripts/database.mjs check /var/lib/afterlife/staging-backup-2026-10-09.sqlite
    ```

    The SQLite backup API handles active WAL writes safely; do not copy just the live database file. Store/download backups using your existing workflow. To restore, stop only `afterlife-staging`, copy a verified backup into a fresh directory such as `/var/lib/afterlife/recovery-2026-10-09/staging.sqlite`, check it, change `DATABASE_PATH` to that file, then run preflight and restart. Keep the old database and its WAL/SHM files together; never overwrite a running database. CSV exports are not database backups.

14. [ ] **Use Docker maintenance tools only if useful.** Native Node already provides SQLite, so this is optional. Build `Dockerfile.tools` off-server for the VPS architecture, transfer/load the image, then mount the database directory using your existing account's UID/GID:

    ```sh
    docker build --platform linux/amd64 -f Dockerfile.tools -t afterlife-sqlite-tools:2026-10-09 .
    docker save afterlife-sqlite-tools:2026-10-09 -o afterlife-sqlite-tools.tar
    ```

    On the VPS:

    ```sh
    docker load -i /path/to/afterlife-sqlite-tools.tar
    docker run --rm --network none --user "$(id -u):$(id -g)" \
      -v /var/lib/afterlife:/var/lib/afterlife \
      afterlife-sqlite-tools:2026-10-09 check /var/lib/afterlife/staging.sqlite
    ```

    Use your usual Docker permissions (`sudo docker` if necessary). No container needs to stay running. Native migration/backup commands above remain the minimal path.

15. [ ] **Keep production separate until launch is approved.** The temporary hostname and its responses are staging. Production requires the final domain, a rebuild for that origin, matching Nginx/Certbot/Access/Turnstile settings, and a clean `/var/lib/afterlife/production.sqlite`. Do not import local or staging responses. Generate permanent book links after approval. Reader ownership cookies do not transfer when the hostname changes.
