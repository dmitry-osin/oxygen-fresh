// User profile helpers: display name, public author view, profile updates.
// Credentials stay in lib/auth.ts; this module owns the editable profile.

import { kv, KvKeys } from "./kv.ts";
import type { AuthorProfile, User } from "@/types/index.ts";
import { getUser } from "./auth.ts";

export type UserProfileInput = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  email?: string;
  avatarUrl?: string;
  socialLinks?: User["socialLinks"];
};

/** Full name when set, otherwise username. */
export function displayName(
  user: Pick<User, "username" | "firstName" | "lastName">,
): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.username;
}

/** Strip secrets for public rendering (post cards, bylines). */
export function toAuthorProfile(user: User): AuthorProfile {
  return {
    username: user.username,
    displayName: displayName(user),
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    location: user.location,
    website: user.website,
    email: user.email,
    avatarUrl: user.avatarUrl,
    socialLinks: user.socialLinks ?? [],
  };
}

/** Fallback when the user record is missing. */
export function authorFallback(username: string): AuthorProfile {
  return {
    username,
    displayName: username,
    socialLinks: [],
  };
}

export async function getAuthor(username: string): Promise<AuthorProfile> {
  const user = await getUser(username);
  return user ? toAuthorProfile(user) : authorFallback(username);
}

/** Load distinct authors for a list of posts (one KV get per unique username). */
export async function getAuthorsMap(
  usernames: string[],
): Promise<Record<string, AuthorProfile>> {
  const unique = [...new Set(usernames.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (username) =>
      [username, await getAuthor(username)] as const
    ),
  );
  return Object.fromEntries(entries);
}

export type ProfileResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

/** Merge profile fields onto an existing user; username / password / role stay. */
export async function updateUserProfile(
  username: string,
  input: UserProfileInput,
): Promise<ProfileResult> {
  const user = await getUser(username);
  if (!user) return { ok: false, error: "User not found." };

  if (input.website && !/^https?:\/\//.test(input.website)) {
    return { ok: false, error: "Website must be an http(s) URL." };
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "Invalid email address." };
  }

  const updated: User = {
    ...user,
    firstName: input.firstName?.trim() || undefined,
    lastName: input.lastName?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    location: input.location?.trim() || undefined,
    website: input.website?.trim() || undefined,
    email: input.email?.trim() || undefined,
    avatarUrl: input.avatarUrl,
    socialLinks: input.socialLinks ?? [],
  };
  await kv.set(KvKeys.user(username), updated);
  return { ok: true, user: updated };
}
