// All TypeScript interfaces for the blog data model.
// Source of truth: ai/requirements.md section 6.2.

export interface Post {
  /** UUID, stable across slug changes */
  id: string;
  /** URL-friendly, unique among published posts */
  slug: string;
  title: string;
  /** Markdown source */
  content: string;
  /** Auto-generated first 200 chars or manual override */
  excerpt: string;
  status: "draft" | "published" | "scheduled";
  /** Array of tag slugs */
  tags: string[];
  template: "default" | "full-width";
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
  publishedAt: string | null;
  authorId: string;
  /** SEO override, falls back to title */
  metaTitle?: string;
  /** SEO override, falls back to excerpt */
  metaDescription?: string;
  /** Optional canonical override */
  canonicalUrl?: string;
}

export interface PostSnapshot {
  /** Same as Post.id */
  id: string;
  /** Timestamp (ISO 8601) of the snapshot */
  versionId: string;
  slug: string;
  title: string;
  /** Markdown at the time of publish */
  content: string;
  excerpt: string;
  tags: string[];
  /** When this version went live */
  publishedAt: string;
  /** When the snapshot was created */
  createdAt: string;
}

export interface Page {
  id: string;
  /** Unique among pages */
  slug: string;
  title: string;
  /** Markdown source */
  content: string;
  template: "default" | "full-width";
  /** Whether this page appears in navigation */
  showInMenu: boolean;
  /** Sort order in menu (if showInMenu = true) */
  menuOrder: number;
  createdAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface Tag {
  /** Primary key */
  slug: string;
  /** Display name */
  name: string;
  description?: string;
  createdAt: string;
}

export interface MenuItem {
  /** UUID */
  id: string;
  type: "page" | "post" | "external";
  /** Display text */
  label: string;
  /** Slug (page/post) or full URL (external) */
  target: string;
  /** Sort order */
  order: number;
}

export interface Settings {
  siteName: string;
  siteDescription: string;
  /** Short text shown in the public footer under the copyright. */
  footerDescription: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  socialLinks: { platform: string; url: string }[];
  theme: "light" | "dark" | "system";
  /** Pagination size for blog index */
  postsPerPage: number;
  /** Giscus comments on post pages (GitHub Discussions). */
  giscusEnabled: boolean;
  /** owner/repo */
  giscusRepo?: string;
  giscusRepoId?: string;
  giscusCategory?: string;
  giscusCategoryId?: string;
  /** How pages map to Discussions (default pathname). */
  giscusMapping?: "pathname" | "url" | "title";
  /** UI language for the widget (default ru). */
  giscusLang?: string;
}

export interface User {
  /** Primary key */
  username: string;
  /** Bcrypt or Argon2 */
  passwordHash: string;
  role: "admin" | "editor";
  createdAt: string;
  /** Public profile (shown on post cards / author byline). */
  firstName?: string;
  lastName?: string;
  bio?: string;
  /** City / region / country */
  location?: string;
  website?: string;
  /** Public contact email */
  email?: string;
  avatarUrl?: string;
  socialLinks?: { platform: string; url: string }[];
}

/** Public-facing author fields (no credentials). */
export interface AuthorProfile {
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  email?: string;
  avatarUrl?: string;
  socialLinks: { platform: string; url: string }[];
}

export interface Session {
  token: string;
  username: string;
  /** ISO 8601 */
  expiresAt: string;
}

/** Managed redirect (F18): stored at ["redirects", from]. */
export interface RedirectEntry {
  from: string;
  to: string;
  code: 301 | 302;
}
