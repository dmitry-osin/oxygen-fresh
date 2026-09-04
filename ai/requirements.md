# Blog Requirements Specification
# Deno + Fresh 2.3.3 — Self-Hosted Markdown Blog CMS
# Language: RU (spec), EN (code comments)

---

## 1. Philosophy

A minimal, fast, self-hosted blog engine. Server-first rendering. Zero client-side JavaScript on the public site. Markdown as the single source of truth for content. Snapshots on every publish for history.

The guiding principle: **Ghost's feature set, WordPress's complexity is forbidden.**

---

## 2. Out of Scope — Explicitly Not Built

| Feature | Verdict | Rationale |
|---------|---------|-----------|
| Comments system | **CUT** | Moderation, spam, notifications, threading = weeks of work. Integrate Giscus (GitHub Discussions) if needed — 2 hours. |
| Multilingual / i18n | **CUT** | Doubles schema, UI, URL complexity. For a personal blog: run a second instance. |
| Email subscriptions / newsletters | **CUT** | Becomes a publishing platform, not a blog. Integrate Buttondown / Mailchimp via a signup form. |
| E-commerce / paid content | **CUT** | Completely different product. Out of scope by definition. |
| Visual page builder (Elementor-style) | **CUT** | Requires drag-and-drop grid, widget system, preview engine. Fresh is server-first, not a CMS constructor. |
| Plugin architecture | **CUT** | Fresh has no plugin contract. Hooks, sandboxing, compatibility = architectural overkill. |
| Real-time collaborative editing | **CUT** | WebSockets + OT/CRDT algorithms. Months of R&D for a single-author blog. |
| Custom image CDN / Sharp pipeline | **CUT** | Use `srcset` + WebP + Deno static file serving. Do not build a microservice for image resizing. |
| Bulk operations on posts | **DEFER** | Low frequency. Can be done via JSON export → edit → import. |

---

## 3. Deployment & Infrastructure

**No Deno Deploy.** The blog runs on the user's own server.

### 3.1 Runtime
- Single Docker container: `denoland/deno:alpine`
- Deno compiles TypeScript on container start
- No orchestration (no Kubernetes, no docker-compose unless the user wants it later)

### 3.2 Storage
- **Deno KV** persists to a local SQLite file (`kv.sqlite3`)
- Mount `/app/data` as a Docker volume for durability across restarts
- One file = one backup target
- User-uploaded images go to `/app/static/uploads`, also a mounted volume

### 3.3 Reverse Proxy
- Nginx or Traefik in front of the container
- TLS via Let's Encrypt
- Static assets (CSS, images, fonts) served directly by Nginx, bypassing Deno
- Fresh app exposed on internal port (default 8000)
- No SSL logic inside the application

### 3.4 Backup Strategy
- Cron job stops the container
- `tar czf backup-$(date +%F).tar.gz data/ static/uploads/`
- Upload to S3 / rsync / local backup disk
- Restart container
- Atomic, simple, no live DB snapshots needed (SQLite is a single file)

### 3.5 Environment Variables
All configuration via environment variables (12-factor app). No config files baked into the image.

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt/Argon2 hash of the admin password |
| `SESSION_SECRET` | Yes | Random string for cookie signing (min 32 chars) |
| `PORT` | No | Defaults to `8000` |
| `KV_PATH` | No | Defaults to `./data/kv.sqlite3` |
| `UPLOAD_DIR` | No | Defaults to `./static/uploads` |
| `SITE_URL` | Yes | Public URL, e.g. `https://blog.example.com` |
| `SITE_NAME` | No | First-run site title (seeded into KV settings once) |
| `SITE_DESCRIPTION` | No | First-run site description |
| `FOOTER_DESCRIPTION` | No | First-run footer blurb |
| `THEME` | No | First-run theme: `light` / `dark` / `system` |
| `POSTS_PER_PAGE` | No | First-run pagination size (1–100) |
| `DEFAULT_META_TITLE` | No | First-run default SEO title |
| `DEFAULT_META_DESCRIPTION` | No | First-run default SEO description |
| `GISCUS_*` | No | First-run Giscus seed (`ENABLED`, `REPO`, `REPO_ID`, `CATEGORY`, `CATEGORY_ID`, `MAPPING`, `LANG`) |
| `CONTACT_FORM_*` / `CONTACT_CAPTCHA_ENABLED` | No | First-run contact form seed |
| `ADMIN_FIRST_NAME` / `LAST_NAME` / `BIO` / `EMAIL` / `LOCATION` / `WEBSITE` | No | Applied only when the admin user is created |

---

## 4. Code Quality Standards

All code comments MUST be in **English**. Variable names, function names, types — English only. No transliteration.

### 4.1 Cyclomatic Complexity
- Every function ≤ 5 decision points (`if` / `switch` / `for` / `while` / ternary)
- Extract early, return early
- No nested conditionals deeper than 2 levels

### 4.2 Cognitive Complexity
- Code must be readable at a glance
- Break nested callbacks, long chains, and implicit state into named helper functions
- One idea per function
- Maximum cognitive complexity per function: 7

### 4.3 Architecture Rules
- **Explicit over Implicit**: no magic strings, no hidden conventions. KV key patterns are named constants.
- **No Abstraction for Abstraction's Sake**: do not build a generic "repository layer" or "service factory" until there are 3+ concrete use cases.
- **One Module, One Responsibility**: `lib/posts.ts` handles posts, `lib/pages.ts` handles pages. No omnibus `db.ts` with 20 exported functions.
- **File size**: keep files under 200 lines. Split when a file grows.

---

## 5. UI/UX Principles

### 5.1 Admin Panel
- **Single sidebar navigation**: persistent left sidebar on desktop. No hamburger menu. No nested accordions deeper than 2 levels. Every section reachable in ≤ 2 clicks.
- **Editor = full screen**: the Markdown editor opens in a dedicated view, not a modal. Title, metadata, and content share one scrollable canvas. No split-pane confusion.
- **Destructive actions = explicit**: delete buttons are red and always require confirmation. Slug changes show a warning about breaking URLs. No "undo" — show a confirm modal with the item name.
- **Zero hidden state**: all editable fields are visible. No "advanced" collapsible panels that hide SEO or slug fields. If a field exists, it is on screen.
- **Drag-and-drop only where expected**: menu reordering uses drag handles. Post list uses click-to-sort columns. Do not mix metaphors.
- **Inline validation**: slug uniqueness checked on blur. Title emptiness checked on save attempt. No surprise errors after form submission.
- **Light / Dark theme**: system-aware default. Toggle in settings. Admin uses a dark-friendly palette; public site uses a minimal, readable light theme.

### 5.2 Public Site
- **Zero JavaScript**: blog posts render as static HTML. No hydration, no islands on the reader side. Only the admin panel uses client-side JS.
- **Minimal design**: typography-first, generous whitespace, no decorative gradients or heavy shadows.
- **Responsive**: mobile-first CSS via Tailwind.

---

## 6. Data Model & KV Schema

Deno KV is the only database. All data is stored as key-value pairs.

### 6.1 Key Patterns

```typescript
// Posts
["posts", "published", slug]       -> Post          // public-facing post
["posts", "draft", id]             -> Post          // draft or unpublished edit
["posts_by_tag", tagSlug, postId]  -> postId        // secondary index
["post_ids"]                       -> string[]      // all post IDs (for listing)

// Pages
["pages", slug]                    -> Page
["page_ids"]                       -> string[]

// Tags
["tags", slug]                     -> Tag
["tag_ids"]                        -> string[]

// Versions (snapshot on publish)
["post_versions", postId, timestamp] -> PostSnapshot
["post_version_meta", postId]      -> { count: number, latestTimestamp: string }

// Menu
["menu", "items"]                  -> MenuItem[]

// Settings
["settings"]                       -> Settings

// Analytics
["views", "post", postId]          -> number (atomic increment)
["views", "page", pageId]          -> number
["analytics", "daily", date]       -> { postViews: number, pageViews: number }

// Redirects
["redirects", oldSlug]             -> newSlug

// Users / Auth
["users", username]                -> User
["sessions", token]                -> Session
```

### 6.2 Types

```typescript
// All TypeScript types live in types/index.ts

interface Post {
  id: string;               // UUID, stable across slug changes
  slug: string;             // URL-friendly, unique among published posts
  title: string;
  content: string;          // Markdown
  excerpt: string;          // Auto-generated first 200 chars or manual override
  status: "draft" | "published" | "scheduled";
  tags: string[];           // Array of tag slugs
  template: "default" | "full-width";
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  publishedAt: string | null;
  authorId: string;
  metaTitle?: string;       // SEO override, falls back to title
  metaDescription?: string; // SEO override, falls back to excerpt
  canonicalUrl?: string;    // Optional canonical override
}

interface PostSnapshot {
  id: string;               // Same as Post.id
  versionId: string;        // Timestamp (ISO 8601) of the snapshot
  slug: string;
  title: string;
  content: string;          // Markdown at the time of publish
  excerpt: string;
  tags: string[];
  publishedAt: string;      // When this version went live
  createdAt: string;        // When the snapshot was created
}

interface Page {
  id: string;
  slug: string;             // Unique among pages
  title: string;
  content: string;          // Markdown
  template: "default" | "full-width";
  showInMenu: boolean;      // Whether this page appears in navigation
  menuOrder: number;        // Sort order in menu (if showInMenu = true)
  createdAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface Tag {
  slug: string;             // Primary key
  name: string;             // Display name
  description?: string;
  createdAt: string;
}

interface MenuItem {
  id: string;               // UUID
  type: "page" | "post" | "external";
  label: string;            // Display text
  target: string;           // slug (page/post) or full URL (external)
  order: number;            // Sort order
}

interface Settings {
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  socialLinks: { platform: string; url: string }[];
  theme: "light" | "dark" | "system";
  postsPerPage: number;     // Pagination size for blog index
}

interface User {
  username: string;         // Primary key
  passwordHash: string;     // Bcrypt or Argon2
  role: "admin" | "editor";
  createdAt: string;
}

interface Session {
  token: string;
  username: string;
  expiresAt: string;        // ISO 8601
}
```

---

## 7. Feature Specifications

### 7.1 MVP (Must-Have)

#### F1 — Posts CRUD
- Create, read, update, delete blog posts
- Fields: title, slug (auto-generated from title, editable), content (Markdown), excerpt, status, tags, template, meta fields
- Slug uniqueness enforced at save time (check KV before write)
- Auto-generate excerpt from first 200 characters of rendered text if not provided
- Status transitions:
  - `draft` → `published`: triggers snapshot creation, sets `publishedAt`
  - `published` → `draft`: post disappears from public site, remains in KV as draft
  - `scheduled`: check `publishedAt` date on every server start / cron; auto-publish when due

#### F2 — Pages CRUD
- Same as Posts but without: tags, status, publishedAt, scheduling
- Pages are always "published" once created
- Field `showInMenu` controls visibility in navigation
- Field `menuOrder` controls sort position

#### F3 — Tags CRUD
- Create, read, update, delete tags
- Tag slug is the primary key
- On tag delete: remove tag reference from all posts (atomic batch update)
- Tag page (`/tag/:slug`) lists all posts with that tag

#### F4 — Markdown Editor (Split-Pane)
- Left pane: `<textarea>` with Markdown content
- Right pane: live preview rendered server-side via `/api/preview` endpoint
- Preview updates debounced (300ms)
- Basic Markdown toolbar: bold, italic, heading, link, image, code block, quote, list
- "Insert image" button opens media library modal; selecting an image inserts `![alt](/uploads/filename.png)` at cursor position
- "Focus mode": hide preview, textarea takes full width
- All editor JS lives in `islands/MarkdownEditor.tsx`

#### F5 — Media Library
- Upload images via drag-and-drop or file picker
- Stored in `static/uploads/` (Docker volume)
- File naming: `{timestamp}-{original-name}` to avoid collisions
- Supported formats: PNG, JPG, WebP, GIF, SVG
- Max file size: 5MB
- Library view: grid of thumbnails, click to select/insert, delete button with confirmation
- Validation: MIME type check, size check, safe filename (alphanumeric + dash + dot)

#### F6 — Menu Builder
- Drag-and-drop reordering of menu items
- Add items: select type (page / post / external), pick target, set label
- Delete items with confirmation
- Order persisted to KV as `MenuItem[]`
- Public site reads menu on every render (cached in memory for 60s)

#### F7 — Templates
- Posts: `default` (with sidebar) and `full-width` (no sidebar)
- Pages: same plus `blank` — standalone HTML document with no blog chrome;
  CSS/JS live in the page markup (`<style>` / `<script>`). Menu can still
  link to `/page/:slug`. Blank responses use a relaxed CSP (admin-only write).
- Template selection in post/page editor
- Template affects layout rendering in `routes/[slug].tsx` and
  `routes/page/[slug].tsx`

#### F8 — Version History (Snapshot on Publish)
- Every time a post is published (or re-published), an immutable `PostSnapshot` is saved
- Snapshots stored under `["post_versions", postId, timestamp]`
- Admin UI: "History" tab in post editor
- List: date of publish, title, tags
- Actions per version:
  - **View**: render version as read-only HTML with a "Version from YYYY-MM-DD" badge
  - **Restore to draft**: copy version content into a new draft. User must explicitly publish again. No auto-overwrite.
- No diff view in MVP (can be added later)
- Draft edits do NOT create snapshots

#### F9 — Authentication
- Single admin user (hardcoded username or created on first setup)
- Password hashed with Bcrypt or Argon2
- Session-based auth: opaque token in `httpOnly` cookie
- KV stores sessions with expiration
- Middleware on `/admin/*` routes checks session validity
- Logout clears cookie and deletes session from KV

#### F10 — SEO Basics
- Auto-generated `sitemap.xml` (resource route, includes all published posts and pages)
- Auto-generated `robots.txt`
- OpenGraph tags per post/page: `og:title`, `og:description`, `og:url`, `og:type`
- Twitter Card tags
- Canonical URL (auto or override)
- Structured data (JSON-LD) for BlogPosting schema on post pages

#### F11 — RSS Feed
- `/rss.xml` — resource route, all published posts, ordered by `publishedAt` desc
- `/rss.xml?tag=slug` — filtered by tag
- Valid RSS 2.0 with full content (not just excerpt)

#### F12 — Settings Page
- Site name, description, logo upload, favicon upload
- Default SEO meta title/description
- Social links (array of platform + URL)
- Theme preference (light / dark / system)
- Posts per page (pagination size)
- All settings stored in single KV key `["settings"]`

#### F13 — Analytics Dashboard
- Counters stored in KV, updated via atomic increment
- Metrics:
  - Total posts, total pages, total tags
  - Total views (all time)
  - Views per post (top 10)
  - Views per page (top 10)
  - Views over last 7 days (daily aggregation)
- Dashboard page: `/admin/analytics`
- Charts rendered server-side as SVG or via lightweight island (Recharts only if bundle size is acceptable)

#### F14 — Export / Import
- **Export**: JSON dump of all data (posts, pages, tags, settings, menu, redirects) — downloadable file
- **Import**: upload JSON file, validate schema, replace all data atomically
- Used for backup and migration
- Format: `{ version: "1.0", exportedAt: "...", data: { posts: [...], pages: [...], ... } }`

### 7.2 Should-Have (v2)

#### F15 — Performance Dashboard
- Page at `/admin/performance`
- Metrics: average response time (last 100 requests), cache hit rate, page size distribution, Core Web Vitals (if available via browser API in admin)
- Deno KV read/write latency

#### F16 — Search
- Client-side search using Pagefind (static search index generated at build time or on publish)
- Or server-side: build an inverted index in KV (word → postIds) on every publish
- Search page: `/search?q=...`

#### F17 — Dark Theme (Public Site)
- Toggle in site footer or header
- Persist preference in `localStorage` (only JS on public site)
- Tailwind `dark:` variants

#### F18 — Redirects Management
- Admin page `/admin/redirects`
- Add 301/302 redirects: old path → new path
- Checked in middleware before route matching
- Stored in KV `["redirects", oldSlug]`

### 7.3 Nice-to-Have (v3)

#### F19 — Version Diff View
- Side-by-side comparison of two PostSnapshots
- Highlight added/removed/changed lines

#### F20 — Scheduled Posts Auto-Publish
- Cron-like check on server start + every hour
- Posts with `status: "scheduled"` and `publishedAt <= now` are auto-published

#### F21 — Related Posts
- Auto-suggest related posts based on shared tags
- Show "Related" section at bottom of post page

#### F22 — Table of Contents (TOC)
- Auto-generate TOC from H2/H3 headings in post content
- Rendered in sidebar for `default` template

#### F23 — Import from WordPress/Ghost
- Parse WordPress XML export or Ghost JSON export
- Map to internal schema, import as drafts

---

## 8. Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Deno 2.x | Native TypeScript, modern stdlib, no node_modules |
| Framework | Fresh 2.3.3 | Server-first, islands architecture, file-based routing |
| Database | Deno KV | Zero-config, SQLite-backed locally, single-file backup |
| Styling | Tailwind CSS | Utility-first, minimal CSS bundle, dark mode support |
| Markdown | `marked` (Deno-compatible) | Zero-deps option, extensible, GitHub-flavored |
| Code Highlight | `highlight.js` | Server-side syntax highlighting for code blocks |
| Auth | Bcrypt (Deno module) | Industry standard, no external dependencies |
| Charts | SVG (server-rendered) or lightweight island | Avoid heavy chart libraries in MVP |
| Icons | Lucide (Preact components) | Lightweight, consistent icon set |
| Search | Pagefind (v2) or custom KV index | Static search index, no external service |

---

## 9. File Structure (Target)

```
blog/
├── main.ts                      # App() entry, middleware registration
├── deno.json                    # Dependencies, tasks, path aliases
├── vite.config.ts               # Vite config (Fresh default)
├── .env.example                 # Template for env vars
├── Dockerfile                   # Single-stage Alpine build
├── data/                        # Docker volume: kv.sqlite3
├── static/
│   ├── uploads/                 # Docker volume: user images
│   ├── css/
│   └── favicon.ico
├── routes/
│   ├── _app.tsx                 # Root layout (html, head, body)
│   ├── _middleware.ts           # Global middleware (security headers)
│   ├── index.tsx                # Blog index (paginated post list)
│   ├── [slug].tsx               # Single post page
│   ├── page/
│   │   └── [slug].tsx           # Static page renderer
│   ├── tag/
│   │   └── [slug].tsx           # Tag archive page
│   ├── rss.xml.ts               # RSS resource route
│   ├── sitemap.xml.ts           # Sitemap resource route
│   ├── robots.txt.ts            # Robots resource route
│   ├── search.tsx               # Search results page (v2)
│   └── admin/
│       ├── _middleware.ts       # Auth guard
│       ├── _layout.tsx          # Admin layout (sidebar)
│       ├── index.tsx            # Dashboard / overview
│       ├── posts/
│       │   ├── index.tsx        # Post list
│       │   └── [id].tsx         # Post editor
│       ├── pages/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       ├── tags/
│       │   ├── index.tsx
│       │   └── [slug].tsx
│       ├── media.tsx            # Media library
│       ├── menu.tsx             # Menu builder
│       ├── settings.tsx         # Site settings
│       ├── analytics.tsx        # Stats dashboard
│       ├── performance.tsx      # Performance metrics (v2)
│       ├── redirects.tsx        # Redirect management (v2)
│       └── export-import.tsx    # Backup / restore
├── islands/                     # Client-hydrated components only
│   ├── MarkdownEditor.tsx       # Split-pane editor
│   ├── MediaUploader.tsx        # Drag-and-drop upload
│   ├── MenuBuilder.tsx          # Drag-and-drop menu
│   ├── PostListFilters.tsx      # Sort/filter controls
│   └── AnalyticsChart.tsx       # Simple SVG chart (v2)
├── components/                  # Server-rendered components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   ├── PostCard.tsx
│   ├── PageCard.tsx
│   ├── TagBadge.tsx
│   ├── Pagination.tsx
│   ├── SeoMeta.tsx
│   └── JsonLd.tsx
├── lib/
│   ├── kv.ts                    # KV wrapper, key constants, atomic ops
│   ├── posts.ts                 # Post CRUD + snapshot logic
│   ├── pages.ts                 # Page CRUD
│   ├── tags.ts                  # Tag CRUD
│   ├── media.ts                 # File upload, validation, storage
│   ├── menu.ts                  # Menu read/write
│   ├── auth.ts                  # Hash, verify, session create/validate
│   ├── markdown.ts              # renderMarkdown(), sanitize HTML
│   ├── seo.ts                   # Meta tag generation, sitemap builder
│   ├── rss.ts                   # RSS XML generation
│   ├── analytics.ts             # View counter, aggregation
│   └── settings.ts              # Settings read/write with defaults
├── types/
│   └── index.ts                 # All TypeScript interfaces
└── utils/
    ├── slugify.ts               # Title → slug conversion
    ├── date.ts                  # Date formatting helpers
    └── validate.ts              # Input validation helpers
```

---

## 10. Security Checklist

- [ ] `httpOnly`, `Secure`, `SameSite=Strict` cookies
- [ ] CSP headers via middleware (no inline scripts on public site)
- [ ] Input sanitization: strip HTML from user input except editor content (which is Markdown → sanitized HTML)
- [ ] File upload validation: MIME type, extension, size, safe filename
- [ ] Rate limiting on login endpoint (in-memory sliding window)
- [ ] No sensitive data in client-side JS (env vars, hashes, tokens)
- [ ] `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`

---

## 11. Performance Targets

- Time to First Byte (TTFB) < 100ms for cached pages
- Total page weight (public post) < 150KB (HTML + CSS + images)
- Zero client-side JS on public pages (except dark mode toggle in v2)
- KV read for single post < 5ms
- Admin panel initial bundle < 100KB (islands only)

---

*End of requirements. Last updated: 2026-09-01.*
