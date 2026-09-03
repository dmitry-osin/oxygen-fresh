// Giscus comments widget (GitHub Discussions). Loads client.js once and
// keeps the iframe theme in sync with the public .dark class (F17).

import { useEffect, useRef } from "preact/hooks";
import { PUBLIC_TYPE_SECTION } from "@/lib/public-ui.ts";

export interface GiscusProps {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: "pathname" | "url" | "title";
  lang?: string;
}

function currentTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function postTheme(theme: "dark" | "light") {
  const iframe = document.querySelector<HTMLIFrameElement>(
    "iframe.giscus-frame",
  );
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme } } },
    "https://giscus.app",
  );
}

export default function GiscusComments(props: GiscusProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Avoid duplicate widgets on Soft nav / remount.
    host.replaceChildren();

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", props.repo);
    script.setAttribute("data-repo-id", props.repoId);
    script.setAttribute("data-category", props.category);
    script.setAttribute("data-category-id", props.categoryId);
    script.setAttribute("data-mapping", props.mapping ?? "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", currentTheme());
    script.setAttribute("data-lang", props.lang ?? "ru");
    script.setAttribute("data-loading", "lazy");
    host.appendChild(script);

    const observer = new MutationObserver(() => postTheme(currentTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      host.replaceChildren();
    };
  }, [
    props.repo,
    props.repoId,
    props.category,
    props.categoryId,
    props.mapping,
    props.lang,
  ]);

  return (
    <section class="mt-12 not-prose" aria-label="Comments">
      <h2 class={`${PUBLIC_TYPE_SECTION} mb-4`}>Comments</h2>
      <div ref={hostRef} class="giscus" />
    </section>
  );
}
