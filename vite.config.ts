import path from "node:path";
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

const root = import.meta.dirname ?? path.resolve(".");
const dataDir = path.join(root, "data");
const uploadsDir = path.join(root, "static", "uploads");

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  // KV SQLite (and its WAL/SHM) and uploads change on normal requests.
  // Watching them causes full browser reloads that feel like blocked
  // navigations (especially on Windows). Absolute paths + globs — Deno's
  // Win32 watcher is unreliable with globs alone.
  server: {
    watch: {
      ignored: [
        dataDir,
        path.join(dataDir, "**"),
        path.join(dataDir, "kv.sqlite3"),
        path.join(dataDir, "kv.sqlite3-wal"),
        path.join(dataDir, "kv.sqlite3-shm"),
        uploadsDir,
        path.join(uploadsDir, "**"),
        "**/data/**",
        "**/static/uploads/**",
        "**/*.sqlite3",
        "**/*.sqlite3-wal",
        "**/*.sqlite3-shm",
        // Windows reserved names (often created by `curl -o NUL` / `2>nul`)
        path.join(root, "NUL"),
        path.join(root, "nul"),
        "**/NUL",
        "**/nul",
      ],
    },
  },
});
