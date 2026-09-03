import path from "node:path";
import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

const root = import.meta.dirname ?? path.resolve(".");

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  // KV SQLite (and its WAL/SHM) and uploads change on normal requests.
  // Watching them causes full browser reloads that feel like blocked
  // navigations (especially on Windows). Use absolute paths — globs alone
  // are unreliable with Deno's file watcher on Win32.
  server: {
    watch: {
      ignored: [
        path.join(root, "data"),
        path.join(root, "static", "uploads"),
        "**/*.sqlite3",
        "**/*.sqlite3-wal",
        "**/*.sqlite3-shm",
      ],
    },
  },
});
