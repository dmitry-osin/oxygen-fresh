// Server-side search (F16): an inverted index in KV (word -> postIds)
// rebuilt every time a post is published, updated, unpublished or
// deleted (hooks in lib/post-mutations.ts and lib/import.ts).
// Source: ai/requirements.md F16, search page /search?q=.

import { kv, KvKeys } from "./kv.ts";
import { plainText } from "./markdown.ts";
import { getPostById } from "./posts.ts";
import type { Post } from "@/types/index.ts";

const MIN_WORD_LENGTH = 2;
const MAX_WORDS_PER_POST = 2000;
const INDEX_CHUNK = 500; // KV ops per atomic commit
// Poor-man's stemmer: truncating both indexed and queried words to the
// same length makes Russian inflections ("хлеба" / "хлеб",
// "закваска" / "закваске") share one index entry. Four chars cover the
// common Russian endings (-а, -и, -е, -у, -ов, -ами). Rare false
// positives are acceptable for blog search.
const STEM_LENGTH = 4;

/** Normalized words (unicode letters/digits) for indexing and queries. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) =>
      word.length > STEM_LENGTH ? word.slice(0, STEM_LENGTH) : word
    )
    .filter((word) => word.length >= MIN_WORD_LENGTH);
}

function postWords(post: Post): string[] {
  const words = tokenize(`${post.title} ${plainText(post.content)}`);
  return [...new Set(words)].slice(0, MAX_WORDS_PER_POST);
}

async function setChunked(
  keys: Deno.KvKey[],
  value: string,
): Promise<void> {
  for (let i = 0; i < keys.length; i += INDEX_CHUNK) {
    const op = kv.atomic();
    for (const key of keys.slice(i, i + INDEX_CHUNK)) op.set(key, value);
    await op.commit();
  }
}

async function deleteChunked(keys: Deno.KvKey[]): Promise<void> {
  for (let i = 0; i < keys.length; i += INDEX_CHUNK) {
    const op = kv.atomic();
    for (const key of keys.slice(i, i + INDEX_CHUNK)) op.delete(key);
    await op.commit();
  }
}

/** (Re)index a post: remove stale word entries, write the new ones. */
export async function indexPost(post: Post): Promise<void> {
  await unindexPost(post.id);
  const words = postWords(post);
  await setChunked(
    words.map((word) => KvKeys.searchIndex(word, post.id)),
    post.id,
  );
  await kv.set(KvKeys.searchWords(post.id), words);
}

/** Remove a post from the index (unpublish, delete, re-index). */
export async function unindexPost(postId: string): Promise<void> {
  const words = (await kv.get<string[]>(KvKeys.searchWords(postId))).value ??
    [];
  await deleteChunked(
    words.map((word) => KvKeys.searchIndex(word, postId)),
  );
  await kv.delete(KvKeys.searchWords(postId));
}

export interface SearchHit {
  post: Post;
  score: number;
}

/**
 * Posts matching every (or most) query words, best match first.
 * Posts are re-fetched and filtered to published, so a stale index
 * entry never leaks a draft.
 */
export async function searchPosts(query: string): Promise<SearchHit[]> {
  const words = tokenize(query);
  if (words.length === 0) return [];
  const scores = new Map<string, number>();
  for (const word of words.slice(0, 20)) {
    const iter = kv.list<string>({ prefix: KvKeys.searchIndexWord(word) });
    for await (const entry of iter) {
      if (typeof entry.value !== "string" || entry.value === "") continue;
      scores.set(entry.value, (scores.get(entry.value) ?? 0) + 1);
    }
  }
  const hits: SearchHit[] = [];
  for (const [postId, score] of scores) {
    const post = await getPostById(postId);
    if (post?.status === "published") hits.push({ post, score });
  }
  return hits
    .sort((a, b) =>
      b.score - a.score ||
      (b.post.publishedAt ?? "").localeCompare(a.post.publishedAt ?? "")
    )
    .slice(0, 20);
}
