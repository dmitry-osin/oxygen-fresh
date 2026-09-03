// Compact author card for the post sidebar.

import { Globe, Mail, MapPin, User } from "lucide-preact";
import type { AuthorProfile } from "@/types/index.ts";
import {
  PUBLIC_CARD,
  PUBLIC_LINK,
  PUBLIC_TYPE_META,
  PUBLIC_TYPE_SECTION,
} from "@/lib/public-ui.ts";

export function AuthorCard({ author }: { author: AuthorProfile }) {
  return (
    <section class={`${PUBLIC_CARD} p-4`}>
      <h3 class={`${PUBLIC_TYPE_SECTION} mb-3`}>Author</h3>
      <div class="flex flex-col items-start gap-3">
        {author.avatarUrl
          ? (
            <img
              src={author.avatarUrl}
              alt=""
              class="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
          )
          : (
            <span class="inline-flex w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
              <User size={28} class="opacity-50" aria-hidden="true" />
            </span>
          )}
        <div class="min-w-0 w-full space-y-2">
          <div>
            <p class="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {author.displayName}
            </p>
            {(author.firstName || author.lastName) &&
                author.displayName !== author.username
              ? <p class={PUBLIC_TYPE_META}>@{author.username}</p>
              : null}
            {author.location && (
              <p
                class={`${PUBLIC_TYPE_META} inline-flex items-center gap-1 mt-1`}
              >
                <MapPin size={12} aria-hidden="true" />
                {author.location}
              </p>
            )}
          </div>
          {author.bio && (
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {author.bio}
            </p>
          )}
          <ul class={`flex flex-col gap-1.5 ${PUBLIC_TYPE_META}`}>
            {author.website && (
              <li>
                <a
                  href={author.website}
                  rel="noopener noreferrer"
                  class={`${PUBLIC_LINK} inline-flex items-center gap-1.5`}
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
                  class={`${PUBLIC_LINK} inline-flex items-center gap-1.5 break-all`}
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
      </div>
    </section>
  );
}
