import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  // turndown's ESM build falls back to require() for its DOM parser;
  // load it natively instead of through the ESM-only SSR module runner.
  ssr: { external: ["turndown"] },
});
