// Compact author byline for a single post page.

import { Globe, Mail, MapPin } from "lucide-preact";
import type { AuthorProfile } from "@/types/index.ts";
import {
  PUBLIC_CARD,
  PUBLIC_LINK,
  PUBLIC_TYPE_BODY,
  PUBLIC_TYPE_META,
} from "@/lib/public-ui.ts";

export function AuthorByline({ author }: { author: AuthorProfile }) {
  return (
    <aside class={`${PUBLIC_CARD} not-prose mt-12 flex gap-4`}>
      {author.avatarUrl
        ? (
          <img
            src={author.avatarUrl}
            alt=""
            class="w-14 h-14 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
          />
        )
        : (
          <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
        )}
      <div class="min-w-0 flex-1 space-y-2">
        <div>
          <p class="text-base font-semibold tracking-tight">
            {author.displayName}
          </p>
          {author.location && (
            <p
              class={`${PUBLIC_TYPE_META} inline-flex items-center gap-1 mt-0.5`}
            >
              <MapPin size={12} aria-hidden="true" />
              {author.location}
            </p>
          )}
        </div>
        {author.bio && <p class={PUBLIC_TYPE_BODY}>{author.bio}</p>}
        <ul class={`flex flex-wrap gap-x-4 gap-y-1 ${PUBLIC_TYPE_META}`}>
          {author.website && (
            <li>
              <a
                href={author.website}
                rel="noopener noreferrer"
                class={`${PUBLIC_LINK} inline-flex items-center gap-1`}
              >
                <Globe size={12} aria-hidden="true" />
                Website
              </a>
            </li>
          )}
          {author.email && (
            <li>
              <a
                href={`mailto:${author.email}`}
                class={`${PUBLIC_LINK} inline-flex items-center gap-1`}
              >
                <Mail size={12} aria-hidden="true" />
                {author.email}
              </a>
            </li>
          )}
          {author.socialLinks.map((link) => (
            <li key={link.platform + link.url}>
              <a
                href={link.url}
                rel="noopener noreferrer"
                class={PUBLIC_LINK}
              >
                {link.platform}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
