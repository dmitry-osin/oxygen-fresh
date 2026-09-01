// Server-rendered SEO tags: title, description, canonical,
// OpenGraph and Twitter Card. Source: ai/requirements.md F10.

import type { SeoMetaData } from "@/lib/seo.ts";

export function SeoMeta({ meta }: { meta: SeoMetaData }) {
  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonicalUrl} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonicalUrl} />
      <meta property="og:type" content={meta.ogType} />
      {meta.imageUrl && <meta property="og:image" content={meta.imageUrl} />}
      <meta
        name="twitter:card"
        content={meta.imageUrl ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </>
  );
}
