// Public tag archive: published posts carrying the tag.
// Source: ai/requirements.md F3 (tag page /tag/:slug), UI 5.2.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getTag, listPostsByTag } from "@/lib/tags.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { canonicalUrl } from "@/lib/seo.ts";
import { Header } from "@/components/Header.tsx";
import { Footer } from "@/components/Footer.tsx";
import { PostCard } from "@/components/PostCard.tsx";
import { SeoMeta } from "@/components/SeoMeta.tsx";

export const handler = define.handlers(async (ctx) => {
  const tag = await getTag(ctx.params.slug);
  if (!tag) throw new HttpError(404);
  const [posts, settings, navLinks] = await Promise.all([
    listPostsByTag(tag.slug),
    getSettings(),
    getNavLinks(),
  ]);
  return { data: { tag, posts, settings, navLinks } };
});

export default define.page<typeof handler>(function TagArchive({ data }) {
  const { tag, posts, settings, navLinks } = data;
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
      <Header navLinks={navLinks} siteName={settings.siteName} />
      <main class="max-w-3xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-2">{tag.name}</h1>
        {tag.description && <p class="text-gray-600 mb-6">{tag.description}</p>}
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
        {posts.length === 0 && (
          <p class="text-gray-600">No published posts with this tag yet.</p>
        )}
      </main>
      <Footer siteName={settings.siteName} socialLinks={settings.socialLinks} />
    </>
  );
});
