// SEO helpers: absolute/canonical URLs and JSON-LD structured data.
// Source: ai/requirements.md F10 (section 7.1).

import type { Post } from "@/types/index.ts";

/** Input for the SeoMeta component (OpenGraph, Twitter Card, canonical). */
export interface SeoMetaData {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: "article" | "website";
  imageUrl?: string;
}

/** Public origin of the site (SITE_URL env, trailing slashes stripped). */
export function siteUrl(): string {
  return (Deno.env.get("SITE_URL") ?? "http://localhost:8000").replace(
    /\/+$/,
    "",
  );
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Canonical URL: an explicit override wins, otherwise derive from path. */
export function canonicalUrl(path: string, override?: string): string {
  return override ?? absoluteUrl(path);
}

/** JSON-LD structured data for a blog post (schema.org BlogPosting). */
export function postJsonLd(post: Post): Record<string, unknown> {
  const url = absoluteUrl(`/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.authorId },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}
