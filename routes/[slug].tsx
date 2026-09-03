// Single post page. Template "default" renders with a sidebar,
// "full-width" without. Source: ai/requirements.md F7, F10 (SEO + JSON-LD).

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import {
  getPublishedBySlug,
  listPublishedPosts,
  relatedPosts,
} from "@/lib/posts.ts";
import { listTagsWithCounts } from "@/lib/tags.ts";
import { trackView } from "@/lib/analytics.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings, isGiscusConfigured } from "@/lib/settings.ts";
import { getAuthor } from "@/lib/users.ts";
import { renderMarkdownWithToc } from "@/lib/markdown.ts";
import { canonicalUrl, postJsonLd } from "@/lib/seo.ts";
import { formatDate } from "@/utils/date.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import { Sidebar } from "@/components/Sidebar.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import { JsonLd } from "@/components/JsonLd.tsx";
import { TagBadge } from "@/components/TagBadge.tsx";
import { AuthorByline } from "@/components/AuthorByline.tsx";
import GiscusComments from "@/islands/GiscusComments.tsx";
import {
  PUBLIC_LINK_UNDERLINE,
  PUBLIC_MAIN_PY,
  PUBLIC_PROSE,
  PUBLIC_READING,
  PUBLIC_SHELL,
  PUBLIC_TYPE_META,
  PUBLIC_TYPE_PAGE_TITLE,
  PUBLIC_TYPE_SECTION,
} from "@/lib/public-ui.ts";

export const handler = define.handlers(async (ctx) => {
  const post = await getPublishedBySlug(ctx.params.slug);
  if (!post) throw new HttpError(404);
  const [settings, navLinks, recent, tags, related, author] = await Promise
    .all([
      getSettings(),
      getNavLinks(),
      listPublishedPosts(),
      listTagsWithCounts(),
      relatedPosts(post, 3),
      getAuthor(post.authorId),
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
      author,
      isAdmin: !!ctx.state.user,
    },
  };
});

export default define.page<typeof handler>(function PostPage({ data }) {
  const {
    post,
    html,
    toc,
    settings,
    navLinks,
    recentPosts,
    tags,
    related,
    author,
    isAdmin,
  } = data;
  const article = (
    <article>
      <header class="mb-8">
        <h1 class={PUBLIC_TYPE_PAGE_TITLE}>{post.title}</h1>
        <p class={`${PUBLIC_TYPE_META} mt-3 flex flex-wrap gap-x-3 gap-y-1`}>
          <span>{author.displayName}</span>
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          )}
        </p>
      </header>
      <div
        class={PUBLIC_PROSE}
        // deno-lint-ignore react-no-danger -- sanitized server-side by renderMarkdown()
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {post.tags.length > 0 && (
        <p class="mt-10 not-prose flex flex-wrap gap-1.5">
          {post.tags.map((slug) => {
            const tag = tags.find((t) => t.slug === slug);
            return <TagBadge key={slug} slug={slug} name={tag?.name} />;
          })}
        </p>
      )}
      {post.template === "full-width" && <AuthorByline author={author} />}
      {isGiscusConfigured(settings) && (
        <GiscusComments
          repo={settings.giscusRepo!}
          repoId={settings.giscusRepoId!}
          category={settings.giscusCategory!}
          categoryId={settings.giscusCategoryId!}
          mapping={settings.giscusMapping}
          lang={settings.giscusLang}
        />
      )}
      {related.length > 0 && (
        <section class="mt-12 not-prose">
          <h2 class={`${PUBLIC_TYPE_SECTION} mb-4`}>Related posts</h2>
          <ul class="space-y-2 text-sm">
            {related.map((entry) => (
              <li key={entry.id}>
                <a href={`/${entry.slug}`} class={PUBLIC_LINK_UNDERLINE}>
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
        <JsonLd data={postJsonLd(post, author.displayName)} />
      </Head>
      <PublicLayout
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        navLinks={navLinks}
        socialLinks={settings.socialLinks}
        footerDescription={settings.footerDescription}
        isAdmin={isAdmin}
        editHref={`/admin/posts/${post.id}`}
      >
        {post.template === "full-width"
          ? (
            <main class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY}`}>
              <div class={PUBLIC_READING}>{article}</div>
            </main>
          )
          : (
            <main
              class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY} flex flex-col lg:flex-row gap-10 lg:gap-12`}
            >
              <div class="flex-1 min-w-0">{article}</div>
              <Sidebar
                recentPosts={recentPosts}
                tags={tags}
                toc={toc}
                author={author}
              />
            </main>
          )}
      </PublicLayout>
    </>
  );
});
