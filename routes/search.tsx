// Public search results page (F16): server-side inverted index lookup.
// Source: ai/requirements.md F16 (:371-374, :454). Zero client JS.

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { searchPosts } from "@/lib/search.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { Header } from "@/components/Header.tsx";
import { Footer } from "@/components/Footer.tsx";
import { PostCard } from "@/components/PostCard.tsx";

export const handler = define.handlers(async (ctx) => {
  const query = (ctx.url.searchParams.get("q") ?? "").trim();
  const [results, settings, navLinks] = await Promise.all([
    query ? searchPosts(query) : Promise.resolve([]),
    getSettings(),
    getNavLinks(),
  ]);
  return { data: { query, results, settings, navLinks } };
});

const INPUT =
  "w-full max-w-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded px-3 py-2";

export default define.page<typeof handler>(function SearchPage({ data }) {
  const { query, results, settings, navLinks } = data;
  return (
    <>
      <Head>
        <title>Search - {settings.siteName}</title>
      </Head>
      <Header navLinks={navLinks} siteName={settings.siteName} />
      <main class="max-w-3xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-6">Search</h1>
        <form method="get" class="mb-8">
          <input
            type="search"
            name="q"
            value={query}
            placeholder="Search posts..."
            class={INPUT}
          />
        </form>
        {query && (
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {results.length === 0
              ? `No results for “${query}”.`
              : `${results.length} result${
                results.length === 1 ? "" : "s"
              } for “${query}”.`}
          </p>
        )}
        {results.map((hit) => <PostCard key={hit.post.id} post={hit.post} />)}
      </main>
      <Footer siteName={settings.siteName} socialLinks={settings.socialLinks} />
    </>
  );
});
