// Markdown rendering pipeline: marked (GFM) + highlight.js + sanitize-html.
// Source: ai/requirements.md section 8 (stack) and section 10
// (editor content is Markdown -> sanitized HTML).

import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";
import { slugify } from "@/utils/slugify.ts";

const marked = new Marked(
  { gfm: true, breaks: false, async: false },
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const normalized = normalizeLang(lang);
      const language = hljs.getLanguage(normalized) ? normalized : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

/** Common fence aliases → highlight.js language ids. */
function normalizeLang(lang: string): string {
  const id = lang.trim().toLowerCase();
  const aliases: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    sh: "bash",
    zsh: "bash",
    yml: "yaml",
    md: "markdown",
    text: "plaintext",
    txt: "plaintext",
  };
  return aliases[id] ?? id;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "span",
    "strong",
    "em",
    "del",
    "img",
    "hr",
    "br",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title"],
    code: ["class"],
    span: ["class"],
    pre: ["class"],
    th: ["align"],
    td: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

/** Render Markdown to sanitized HTML (safe to embed on public pages). */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export interface TocEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

/** Decode the handful of entities slugify should not see. */
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Add anchor ids to H2/H3 and collect them as a table of contents (F22).
 * Ids are generated server-side after sanitization (slug of the heading
 * text, "-2" suffix on duplicates), so they cannot be injected.
 */
export function renderMarkdownWithToc(markdown: string): {
  html: string;
  toc: TocEntry[];
} {
  const counts = new Map<string, number>();
  const toc: TocEntry[] = [];
  const html = renderMarkdown(markdown).replace(
    /<h([23])>(.*?)<\/h\1>/g,
    (_match, level: string, inner: string) => {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, ""));
      const base = slugify(text) || "section";
      const seen = counts.get(base) ?? 0;
      counts.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${seen}`;
      toc.push({ level: Number(level) as 2 | 3, text, id });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    },
  );
  return { html, toc };
}

// Decode order matters: &amp; must be last to avoid double-unescaping.
const ENTITY_DECODERS: [RegExp, string][] = [
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#0?39;/g, "'"],
  [/&amp;/g, "&"],
];

/** Strip Markdown down to plain text (used for auto-generated excerpts). */
export function plainText(markdown: string): string {
  const text = sanitizeHtml(
    marked.parse(markdown, { async: false }) as string,
    {
      allowedTags: [],
      allowedAttributes: {},
    },
  );
  return ENTITY_DECODERS.reduce((acc, [re, ch]) => acc.replace(re, ch), text)
    .replace(/\s+/g, " ")
    .trim();
}
