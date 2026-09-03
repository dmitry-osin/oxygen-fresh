# Deployment Guide

Self-hosted deployment of the blog: a single Docker container, Deno KV in a
SQLite file, user uploads on a volume, Nginx with TLS in front. No Deno Deploy
(ai/requirements.md section 3).

## 1. Build and run the container

CI (`.github/workflows/docker.yml`) builds the image on every PR and pushes to
GitHub Container Registry on pushes to `main` and tags `v*`:

```text
ghcr.io/<owner>/<repo>:latest
ghcr.io/<owner>/<repo>:sha-<short-sha>
ghcr.io/<owner>/<repo>:1.2.3   # from tag v1.2.3
```

Pull (package must be public, or authenticate with a PAT / `GITHUB_TOKEN`):

```sh
docker pull ghcr.io/dmitry-osin/oxygen-fresh:latest
```

Or build locally:

```sh
docker build -t oxygen-blog .
docker run -d --name oxygen-blog \
  -p 8000:8000 \
  -v /srv/oxygen-blog/data:/app/data \
  -v /srv/oxygen-blog/static/uploads:/app/static/uploads \
  -e ADMIN_PASSWORD_HASH='$2a$10$...' \
  -e SESSION_SECRET='random-string-min-32-chars' \
  -e SITE_URL='https://blog.example.com' \
  -e SITE_NAME='My Blog' \
  -e SITE_DESCRIPTION='Notes and essays' \
  -e ADMIN_FIRST_NAME='Ada' \
  -e ADMIN_LAST_NAME='Lovelace' \
  --restart unless-stopped \
  oxygen-blog
```

Generate the admin password hash once:

```sh
deno eval 'import bcrypt from "npm:bcryptjs"; console.log(bcrypt.hashSync("your-password", 10))'
```

Generate a session secret: `openssl rand -hex 32`.

On first boot with an empty data volume, the container seeds the admin user and
site settings from env (`lib/bootstrap.ts`). Changing seed vars later does
**not** overwrite values already saved in Admin → Settings / Profile. Full
template: `.env.example`.

### Environment variables

| Variable | Required | Default | Notes |
| -------- | -------- | ------- | ----- |
| `ADMIN_PASSWORD_HASH` | yes | - | Bcrypt hash. **Wrap in single quotes**: the loader expands `$...` inside unquoted/double-quoted values and corrupts the hash. |
| `SESSION_SECRET` | yes | - | Random string, min 32 chars. |
| `SITE_URL` | yes | - | Public URL; enables the `Secure` cookie flag on https. |
| `PORT` | no | `8000` | Internal listen port. |
| `KV_PATH` | no | `./data/kv.sqlite3` | Keep it inside the `/app/data` volume. |
| `UPLOAD_DIR` | no | `./static/uploads` | Keep it inside the uploads volume. |
| `SITE_NAME` | no | `oxygen-blog` | First-run site title (KV seed). |
| `SITE_DESCRIPTION` | no | empty | First-run site description. |
| `FOOTER_DESCRIPTION` | no | empty | First-run footer blurb. |
| `THEME` | no | `system` | First-run theme: `light` / `dark` / `system`. |
| `POSTS_PER_PAGE` | no | `10` | First-run pagination (1–100). |
| `DEFAULT_META_TITLE` / `DEFAULT_META_DESCRIPTION` | no | empty | First-run SEO defaults. |
| `GISCUS_ENABLED` | no | `false` | First-run comments toggle. |
| `GISCUS_REPO` / `GISCUS_REPO_ID` / `GISCUS_CATEGORY` / `GISCUS_CATEGORY_ID` | no | empty | First-run Giscus IDs from giscus.app. |
| `GISCUS_MAPPING` | no | `pathname` | `pathname` / `url` / `title`. |
| `GISCUS_LANG` | no | `ru` | Giscus UI language. |
| `CONTACT_FORM_ENABLED` | no | `false` | First-run public `/contact` form. |
| `CONTACT_FORM_LABEL` | no | `Contact` | Menu label. |
| `CONTACT_FORM_MENU_ORDER` | no | `99` | 0-based menu position. |
| `CONTACT_FORM_INTRO` | no | empty | Intro above the form. |
| `CONTACT_CAPTCHA_ENABLED` | no | `true` | Math captcha on contact form. |
| `ADMIN_FIRST_NAME` / `ADMIN_LAST_NAME` / `ADMIN_BIO` / `ADMIN_EMAIL` / `ADMIN_LOCATION` / `ADMIN_WEBSITE` | no | empty | Applied only when the admin user is created. |

All configuration is environment-only; no config files are baked into the image
(12-factor, ai/requirements.md:61).

## 2. Nginx + TLS

See `docs/nginx.conf.example`: HTTP redirects to HTTPS, Let's Encrypt
certificates, `/uploads/` served directly by Nginx from the volume, everything
else proxied to `127.0.0.1:8000`.

## 3. Backups

Cron job on the host (ai/requirements.md 53-58): stop the container, archive
both volumes, upload off-host, restart. `docs/backup.sh` implements it:

```
0 4 * * *  /srv/oxygen-blog/docs/backup.sh /backups >> /var/log/blog-backup.log 2>&1
```

The archive contains `kv.sqlite3` (all posts, pages, tags, settings, menu,
redirects) and `static/uploads/` (all media). One file = one backup target. To
restore: unpack the archive over the volume mounts and restart the container. An
alternative restore path is the admin Export/Import JSON dump (content data
only, no media files).

## 4. Security checklist (ai/requirements.md section 10)

- [x] `httpOnly`, `Secure` (when `SITE_URL` is https), `SameSite=Strict` session
      cookie - `lib/auth.ts`
- [x] CSP headers via middleware, no inline scripts on the public site -
      `routes/_middleware.ts`; the dark-mode bootstrap is an external
      same-origin file (`static/theme.js`)
- [x] Input sanitization: user input is HTML-escaped by Preact or stripped by
      validators; editor Markdown is rendered through `sanitize-html`
      (`lib/markdown.ts`)
- [x] File upload validation: MIME allowlist, extension match, 5MB cap,
      sanitized filename, no overwrite, no path traversal (`lib/media.ts`)
- [x] Rate limiting on the login endpoint, 5 attempts / 5 minutes, in-memory
      sliding window (`lib/rate-limit.ts`)
- [x] No sensitive data in client-side JS - islands receive only display data;
      env vars and hashes never reach the bundle
- [x] `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
      `Referrer-Policy` - `routes/_middleware.ts`

## 5. Performance (measured on a production build)

Targets from ai/requirements.md section 11, measured 2026-09-02 (local
single-user run, your numbers will vary):

| Metric                        | Target                        | Measured                                                 |
| ----------------------------- | ----------------------------- | -------------------------------------------------------- |
| TTFB, public pages            | < 100 ms                      | 2-6 ms                                                   |
| Public page weight (HTML+CSS) | < 150 KB                      | ~39 KB (4 HTML + 34 CSS + 0.6 theme.js)                  |
| Client JS on public pages     | only the F17 dark-mode toggle | `theme.js`, 557 bytes                                    |
| KV single read                | < 5 ms                        | ~0.1 ms (admin dashboard live probe)                     |
| Admin initial bundle          | < 100 KB                      | ~50 KB uncompressed (entry + preact + signals + islands) |

## 6. Operational notes

- First boot seeds admin + settings from env when the data volume is empty
  (`lib/bootstrap.ts`); see `.env.example`.
- Scheduled posts auto-publish on server start and hourly (`lib/scheduler.ts`).
- In-memory caches (menu, settings, redirects, post/page summaries) expire
  after 60 seconds; admin writes invalidate them immediately.
- The admin panel lives under `/admin`; sessions live in KV for 7 days.
- Container health check probes `GET /` every 30s.
- Logs: `docker logs oxygen-blog`.
