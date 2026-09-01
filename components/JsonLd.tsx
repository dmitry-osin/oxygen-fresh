// JSON-LD structured data script tag (schema.org).
// "<" is escaped so the JSON stays safe inside HTML.

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // deno-lint-ignore react-no-danger -- JSON.stringify of server-side data, "<" escaped; required for JSON-LD
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
