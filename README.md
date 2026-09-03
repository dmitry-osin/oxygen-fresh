# oxygen-blog

A minimal, fast, self-hosted Markdown blog engine. Server-first rendering, zero
client-side JavaScript on the public site (the only exception: the dark-mode
toggle), Deno KV as the single database, snapshots of every post on publish.

Ghost's feature set; WordPress's complexity is forbidden.

## Stack

Deno 2.x, Fresh 2 (islands architecture), Deno KV (SQLite-backed), Tailwind CSS
4, marked + highlight.js, bcrypt sessions.

## Development

```sh
deno install          # dependencies
cp .env.example .env  # fill required + optional first-run seeds
deno task dev         # http://localhost:5173
```

**Required in `.env`:** `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `SITE_URL`.

On startup with an empty KV the app seeds the admin user and site settings from
env (`lib/bootstrap.ts`). Optional first-run vars (`SITE_NAME`, `THEME`,
`ADMIN_FIRST_NAME`, Giscus, contact form, …) are documented in `.env.example`.
Values already saved in Admin → Settings / Profile are never overwritten by env.

Generate the admin password hash:

```sh
deno eval 'import bcrypt from "npm:bcryptjs"; console.log(bcrypt.hashSync("your-password", 10))'
```

Wrap the hash in **single quotes** in `.env` — bcrypt hashes contain `$`, which
the env loader would otherwise expand.

Admin panel: `/admin` (username is always `admin`).

Useful tasks: `deno task check` (fmt + lint + type check), `deno task build`,
`deno task start` (production server on `:8000`).

## Features

- Posts and pages in Markdown with a split-pane editor, live preview and media
  library (drag-and-drop uploads)
- Discard unsaved new drafts when leaving the editor; publish snapshots and
  version history (view, restore, side-by-side diff)
- Tags, menu builder, short links, site settings, 301/302 redirects
- Author profile, contact form (optional captcha), Giscus comments
- SEO: OpenGraph, canonical URLs, JSON-LD, sitemap.xml, robots.txt, RSS
- Analytics (views, daily chart), performance dashboard, JSON export/import,
  WordPress/Ghost import as drafts
- Server-side search, related posts, TOC, scheduled posts
- Light/dark theme for the admin and the public site

## Production

Single Docker container behind Nginx; KV and uploads as volumes; first-boot env
seed; health check on `GET /`. CI builds the image and pushes to GHCR on `main`
(`ghcr.io/<owner>/<repo>`). Build/run, env table, backups and TLS:

[docs/deployment.md](docs/deployment.md)

```sh
docker build -t oxygen-blog .
docker run -d --name oxygen-blog -p 8000:8000 \
  -v /srv/oxygen-blog/data:/app/data \
  -v /srv/oxygen-blog/static/uploads:/app/static/uploads \
  -e ADMIN_PASSWORD_HASH='$2a$10$...' \
  -e SESSION_SECRET='…' \
  -e SITE_URL='https://blog.example.com' \
  oxygen-blog
```

## Project layout

```
routes/      file-based routes (public site + /admin)
islands/     client-hydrated components (admin + theme toggle)
components/  server-rendered components
lib/         data and domain logic (KV, bootstrap, markdown, auth, …)
types/       TypeScript interfaces
utils/       slugify, dates, validation
static/      static assets; uploads/ is a Docker volume
data/        kv.sqlite3; a Docker volume
docs/        deployment, backups, nginx example
ai/          agent-facing plan and requirements (not part of the app)
```
