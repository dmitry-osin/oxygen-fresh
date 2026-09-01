// Markdown rendering pipeline: marked (GFM) + highlight.js + sanitize-html.
// Source: ai/requirements.md section 8 (stack) and section 10
// (editor content is Markdown -> sanitized HTML).

import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

const marked = new Marked(
  { gfm: true, breaks: false, async: false },
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

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
