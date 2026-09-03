// Public search results page (F16): server-side inverted index lookup.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { searchPosts } from "@/lib/search.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { getAuthorsMap } from "@/lib/users.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import { PostCard } from "@/components/PostCard.tsx";
import {
  PUBLIC_INPUT,
  PUBLIC_MAIN_PY,
  PUBLIC_READING,
  PUBLIC_SHELL,
  PUBLIC_TYPE_MUTED,
  PUBLIC_TYPE_PAGE_TITLE,
} from "@/lib/public-ui.ts";

export const handler = define.handlers(async (ctx) => {
  const query = (ctx.url.searchParams.get("q") ?? "").trim();
  const [results, settings, navLinks] = await Promise.all([
    query ? searchPosts(query) : Promise.resolve([]),
    getSettings(),
    getNavLinks(),
  ]);
  const authors = await getAuthorsMap(results.map((hit) => hit.post.authorId));
  return {
    data: {
      query,
      results,
      settings,
      navLinks,
      authors,
      isAdmin: !!ctx.state.user,
    },
  };
});

export default define.page<typeof handler>(function SearchPage({ data }) {
  const { query, results, settings, navLinks, authors, isAdmin } = data;
  return (
    <>
      <Head>
        <title>Search - {settings.siteName}</title>
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
            <h1 class={`${PUBLIC_TYPE_PAGE_TITLE} mb-8`}>Search</h1>
            <form method="get" class="mb-8">
              <input
                type="search"
                name="q"
                value={query}
                placeholder="Search posts…"
                class={PUBLIC_INPUT}
              />
            </form>
            {query && (
              <p class={`${PUBLIC_TYPE_MUTED} mb-6`}>
                {results.length === 0
                  ? `No results for “${query}”.`
                  : `${results.length} result${
                    results.length === 1 ? "" : "s"
                  } for “${query}”.`}
              </p>
            )}
            <div class="space-y-4">
              {results.map((hit) => (
                <PostCard
                  key={hit.post.id}
                  post={hit.post}
                  author={authors[hit.post.authorId]}
                />
              ))}
            </div>
          </div>
        </main>
      </PublicLayout>
    </>
  );
});
