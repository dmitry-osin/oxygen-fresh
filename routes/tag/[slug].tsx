// Public tag archive: published posts carrying the tag.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getTag, listPostsByTag } from "@/lib/tags.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { getAuthorsMap } from "@/lib/users.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import { PostCard } from "@/components/PostCard.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";
import {
  PUBLIC_MAIN_PY,
  PUBLIC_READING,
  PUBLIC_SHELL,
  PUBLIC_TYPE_MUTED,
  PUBLIC_TYPE_PAGE_TITLE,
} from "@/lib/public-ui.ts";

export const handler = define.handlers(async (ctx) => {
  const tag = await getTag(ctx.params.slug);
  if (!tag) throw new HttpError(404);
  const [posts, settings, navLinks] = await Promise.all([
    listPostsByTag(tag.slug),
    getSettings(),
    getNavLinks(),
  ]);
  const authors = await getAuthorsMap(posts.map((p) => p.authorId));
  return {
    data: {
      tag,
      posts,
      settings,
      navLinks,
      authors,
      isAdmin: !!ctx.state.user,
    },
  };
});

export default define.page<typeof handler>(function TagArchive({ data }) {
  const { tag, posts, settings, navLinks, authors, isAdmin } = data;
  return (
    <>
      <Head>
        <SeoMeta
          meta={{
            title: `${tag.name} - ${settings.siteName}`,
            description: tag.description ??
              `Posts tagged ${tag.name} on ${settings.siteName}`,
            canonicalUrl: canonicalUrl(`/tag/${tag.slug}`),
            ogType: "website",
          }}
        />
      </Head>
      <PublicLayout
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        navLinks={navLinks}
        socialLinks={settings.socialLinks}
        footerDescription={settings.footerDescription}
        isAdmin={isAdmin}
      >
        <main class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY}`}>
          <div class={PUBLIC_READING}>
            <header class="mb-10">
              <h1 class={PUBLIC_TYPE_PAGE_TITLE}>{tag.name}</h1>
              {tag.description && (
                <p class={`${PUBLIC_TYPE_MUTED} mt-3`}>{tag.description}</p>
              )}
            </header>
            {posts.length === 0
              ? (
                <p class={PUBLIC_TYPE_MUTED}>
                  No published posts with this tag yet.
                </p>
              )
              : (
                <div class="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      author={authors[post.authorId]}
                    />
                  ))}
                </div>
              )}
          </div>
        </main>
      </PublicLayout>
    </>
  );
});
