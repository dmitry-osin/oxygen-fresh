# Single-stage production image on Deno Alpine.
# Source: ai/requirements.md 35-44 (section 3.1/3.2).
# All configuration comes from environment variables (12-factor);
# /app/data (KV) and /app/static/uploads (media) are Docker volumes.
#
# On first boot with an empty KV, lib/bootstrap.ts seeds the admin user
# (ADMIN_PASSWORD_HASH + optional ADMIN_* profile) and site settings
# (SITE_NAME, THEME, GISCUS_*, CONTACT_*, …). Later admin UI edits win.

FROM denoland/deno:alpine-2.9.6

# Image may default to the non-root `deno` user; build steps need write
# access to /app (node_modules, _fresh). Stay root for build + runtime so
# bind-mounted volumes work without chown on the host.
USER root

WORKDIR /app

# Dependencies first so the layer stays cached between code changes.
COPY deno.json deno.lock ./
RUN deno install

# Application code and the production build.
COPY . .
RUN deno task build \
  && mkdir -p /app/data /app/static/uploads

# Durable data: KV database and uploaded media.
VOLUME ["/app/data", "/app/static/uploads"]

# ── Runtime defaults (override at `docker run` / compose) ─────────────────
ENV PORT=8000 \
    KV_PATH=./data/kv.sqlite3 \
    UPLOAD_DIR=./static/uploads

# ── First-run seeds (written once when KV settings / admin are missing) ───
ENV SITE_NAME=oxygen-blog \
    THEME=system \
    POSTS_PER_PAGE=10 \
    GISCUS_ENABLED=false \
    GISCUS_MAPPING=pathname \
    GISCUS_LANG=ru \
    CONTACT_FORM_ENABLED=false \
    CONTACT_FORM_LABEL=Contact \
    CONTACT_FORM_MENU_ORDER=99 \
    CONTACT_CAPTCHA_ENABLED=true

# Required at runtime (no defaults — pass via -e / compose):
#   ADMIN_PASSWORD_HASH  SESSION_SECRET  SITE_URL
# Optional first-run seeds: SITE_DESCRIPTION, FOOTER_DESCRIPTION,
#   DEFAULT_META_TITLE, DEFAULT_META_DESCRIPTION, GISCUS_REPO*,
#   CONTACT_FORM_INTRO, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_BIO,
#   ADMIN_EMAIL, ADMIN_LOCATION, ADMIN_WEBSITE
# Full list: .env.example

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD deno eval --allow-net --allow-env "const p=Deno.env.get('PORT')??'8000';Deno.exit((await fetch('http://127.0.0.1:'+p+'/')).ok?0:1)"

# Scoped permissions: network (serve), env (config), read/write (KV,
# uploads, static). No subprocess, no ffi, no host-wide access.
CMD ["deno", "task", "start"]
