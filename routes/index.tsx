// Blog index: paginated list of published posts.
// Source: ai/requirements.md F1/F12 (postsPerPage), UI 5.2 (zero JS).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { listPublishedPosts } from "@/lib/posts.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { Header } from "@/components/Header.tsx";
import { Footer } from "@/components/Footer.tsx";
import { PostCard } from "@/components/PostCard.tsx";
import { Pagination } from "@/components/Pagination.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";

export const handler = define.handlers(async (ctx) => {
  const settings = await getSettings();
  const posts = await listPublishedPosts();
  const page = Math.max(1, Number(ctx.url.searchParams.get("page")) || 1);
  const perPage = settings.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
  const pagePosts = posts.slice((page - 1) * perPage, page * perPage);
  const navLinks = await getNavLinks();
  return { data: { settings, posts: pagePosts, page, totalPages, navLinks } };
});

export default define.page<typeof handler>(function Home({ data }) {
  const { settings, posts, page, totalPages, navLinks } = data;
  return (
    <>
      <Head>
        <SeoMeta
          meta={{
            title: settings.defaultMetaTitle ?? settings.siteName,
            description: settings.defaultMetaDescription ??
              settings.siteDescription,
            canonicalUrl: canonicalUrl("/"),
            ogType: "website",
          }}
        />
      </Head>
      <Header navLinks={navLinks} siteName={settings.siteName} />
      <main class="max-w-3xl mx-auto px-4 py-8">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
        {posts.length === 0 && (
          <p class="text-gray-600 dark:text-gray-400">No posts yet.</p>
        )}
        <Pagination page={page} totalPages={totalPages} basePath="/" />
      </main>
      <Footer siteName={settings.siteName} socialLinks={settings.socialLinks} />
    </>
  );
});
