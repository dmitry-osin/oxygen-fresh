# Railway / Railpack

Deploy this repository directly as the `blog` service (Root Directory `/`, builder
Railpack). `railpack.json` pins Deno 2.9.6, installs the frozen lockfile and builds
Fresh. `railway/start.sh` starts `_fresh/server.js` on the Railway `PORT`, listening
on 0.0.0.0 for current Railway dual-stack private networking.
For a legacy IPv6-only environment, set `HOST=[::]`. Do not start `main.ts` directly.

Attach a persistent volume at `/data`. The startup script creates the directories
for `KV_PATH` (default `/data/blog/kv.sqlite3`) and `UPLOAD_DIR` (default `/data/uploads`).
Set `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` (32+ characters) and `SITE_URL` in Railway.
Other first-run settings are documented in `.env.example`. Restore existing data
before the first start when migrating. Keep a single replica and disable sleep.
Use `/` as the deployment healthcheck.

For the shared ahtx.ru / intqst.ru stack, the parent `myserver-stack` repository
provides the Railway IaC and gateway. Its blog service uses port 8000; HTTPS
terminates at Railway's edge. Grant the Railway GitHub App access to this repository
and publish these files here before deploying the parent stack.

The VPS image is built with `docker build -f Dockerfile.vps -t oxygen-blog .`.
The Dockerfile has a distinct name so Railway selects Railpack. GitHub Actions uses
that same path; the existing GHCR Compose workflow is unchanged.
