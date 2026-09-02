// Single post page. Template "default" renders with a sidebar,
// "full-width" without. Source: ai/requirements.md F7, F10 (SEO + JSON-LD).
// Zero client JavaScript (UI 5.2).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import {
  getPublishedBySlug,
  listPublishedPosts,
  relatedPosts,
} from "@/lib/posts.ts";
import { listTags } from "@/lib/tags.ts";
import { trackView } from "@/lib/analytics.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { renderMarkdownWithToc } from "@/lib/markdown.ts";
import { canonicalUrl, postJsonLd } from "@/lib/seo.ts";
import { formatDate } from "@/utils/date.ts";
import { Header } from "@/components/Header.tsx";
import { Footer } from "@/components/Footer.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import { JsonLd } from "@/components/JsonLd.tsx";
import { TagBadge } from "@/components/TagBadge.tsx";

export const handler = define.handlers(async (ctx) => {
  const post = await getPublishedBySlug(ctx.params.slug);
  if (!post) throw new HttpError(404);
  const [settings, navLinks, recent, tags, related] = await Promise.all([
    getSettings(),
    getNavLinks(),
    listPublishedPosts(),
    listTags(),
    relatedPosts(post, 3),
    trackView("post", post.id),
  ]);
  return {
    data: {
      post,
      ...renderMarkdownWithToc(post.content),
      settings,
      navLinks,
      recentPosts: recent.filter((p) => p.id !== post.id).slice(0, 5),
      tags,
      related,
    },
  };
});

export default define.page<typeof handler>(function PostPage({ data }) {
  const { post, html, toc, settings, navLinks, recentPosts, tags, related } =
    data;
  const article = (
    <article>
      <h1 class="text-3xl font-bold mb-2">{post.title}</h1>
      {post.publishedAt && (
        <p class="text-sm text-gray-500 mb-6">{formatDate(post.publishedAt)}</p>
      )}
      <div
        class="prose dark:prose-invert max-w-none"
        // deno-lint-ignore react-no-danger -- sanitized server-side by renderMarkdown()
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {post.tags.length > 0 && (
        <p class="mt-8 not-prose">
          {post.tags.map((slug) => {
            const tag = tags.find((t) => t.slug === slug);
            return <TagBadge key={slug} slug={slug} name={tag?.name} />;
          })}
        </p>
      )}
      {related.length > 0 && (
        <section class="mt-12 not-prose">
          <h2 class="text-xl font-bold mb-3">Related posts</h2>
          <ul class="space-y-1">
            {related.map((entry) => (
              <li key={entry.id}>
                <a href={`/${entry.slug}`} class="underline">
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
  return (
    <>
      <Head>
        <SeoMeta
          meta={{
            title: post.metaTitle ?? post.title,
            description: post.metaDescription ?? post.excerpt,
            canonicalUrl: canonicalUrl(`/${post.slug}`, post.canonicalUrl),
            ogType: "article",
          }}
        />
        <JsonLd data={postJsonLd(post)} />
      </Head>
      <Header navLinks={navLinks} siteName={settings.siteName} />
      {post.template === "full-width"
        ? <main class="max-w-3xl mx-auto px-4 py-8">{article}</main>
        : (
          <main class="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-12">
            <div class="flex-1 min-w-0">{article}</div>
            <Sidebar recentPosts={recentPosts} tags={tags} toc={toc} />
          </main>
        )}
      <Footer siteName={settings.siteName} socialLinks={settings.socialLinks} />
    </>
  );
});
