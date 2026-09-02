# Single-stage production image on Deno Alpine.
# Source: ai/requirements.md 35-44 (section 3.1/3.2).
# All configuration comes from environment variables (12-factor);
# /app/data (KV) and /app/static/uploads (media) are Docker volumes.

FROM denoland/deno:alpine

WORKDIR /app

# Dependencies first so the layer stays cached between code changes.
COPY deno.json deno.lock ./
RUN deno install

# Application code and the production build.
COPY . .
RUN deno task build

# Durable data: KV database and uploaded media.
VOLUME ["/app/data", "/app/static/uploads"]

# PORT env var (defaults to 8000 in the app).
EXPOSE 8000

# Scoped permissions: network (serve), env (config), read/write (KV,
# uploads, static). No subprocess, no ffi, no host-wide access.
CMD ["deno", "task", "start"]
