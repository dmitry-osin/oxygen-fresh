// Admin profile page: name, bio, location, contact links, avatar.
// Stored on the User record in KV (authorId on posts = username).

import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { saveMediaFile } from "@/lib/media.ts";
import { displayName, updateUserProfile } from "@/lib/users.ts";
import { SocialLinksFields } from "@/components/SocialLinksFields.tsx";
import FilePickField from "@/islands/FilePickField.tsx";
import type { User } from "@/types/index.ts";
import { mediaAdminPreviewUrl } from "@/lib/media-urls.ts";
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_INPUT,
  ADMIN_TYPE_ERROR,
  ADMIN_TYPE_LABEL,
  ADMIN_TYPE_MUTED,
  ADMIN_TYPE_SUCCESS,
  AdminPage,
} from "@/components/AdminPage.tsx";

interface ProfileData {
  user: User;
  error: string | null;
  saved: boolean;
}

const INPUT = ADMIN_INPUT;
const LABEL = ADMIN_TYPE_LABEL;
const ACCEPT_IMAGES = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

function parseSocialLinks(
  form: FormData,
): User["socialLinks"] | string {
  const platforms = form.getAll("socialPlatform").map(String);
  const urls = form.getAll("socialUrl").map(String);
  const links: NonNullable<User["socialLinks"]> = [];
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i].trim();
    const url = (urls[i] ?? "").trim();
    if (!platform && !url) continue;
    if (!platform || !/^https?:\/\//.test(url)) {
      return "Each social link needs a platform and an http(s) URL.";
    }
    links.push({ platform, url });
  }
  return links;
}

async function resolveAvatar(
  form: FormData,
  current?: string,
): Promise<{ ok: true; url?: string } | { ok: false; error: string }> {
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: true, url: current };
  }
  const result = await saveMediaFile(file);
  return result.ok
    ? { ok: true, url: result.file.url }
    : { ok: false, error: result.error };
}

export const handler = define.handlers({
  GET(ctx) {
    const user = ctx.state.user!;
    return {
      data: {
        user,
        error: null,
        saved: ctx.url.searchParams.get("saved") === "1",
      },
    };
  },

  async POST(ctx) {
    const user = ctx.state.user!;
    const form = await ctx.req.formData();
    const socialLinks = parseSocialLinks(form);
    if (typeof socialLinks === "string") {
      return { data: { user, error: socialLinks, saved: false } };
    }
    const avatar = await resolveAvatar(form, user.avatarUrl);
    if (!avatar.ok) {
      return { data: { user, error: avatar.error, saved: false } };
    }
    const result = await updateUserProfile(user.username, {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      bio: String(form.get("bio") ?? ""),
      location: String(form.get("location") ?? ""),
      website: String(form.get("website") ?? ""),
      email: String(form.get("email") ?? ""),
      avatarUrl: avatar.url,
      socialLinks,
    });
    if (!result.ok) {
      return { data: { user, error: result.error, saved: false } };
    }
    ctx.state.user = result.user;
    return ctx.redirect("/admin/profile?saved=1");
  },
});

export default define.page<typeof handler>(function ProfilePage({ data }) {
  const { user, error, saved } = data;
  return (
    <AdminPage
      title="Profile"
      description="Your public author details on post cards and bylines."
    >
      <Head>
        <title>Profile - Admin</title>
      </Head>
      {saved && <p class={`${ADMIN_TYPE_SUCCESS} mb-4`}>Profile saved.</p>}
      {error && <p class={`${ADMIN_TYPE_ERROR} mb-4`}>{error}</p>}
      <p class={`${ADMIN_TYPE_MUTED} mb-6`}>
        Signed in as <strong>{user.username}</strong>
        {" · "}
        Public name: <strong>{displayName(user)}</strong>
      </p>
      <form method="post" enctype="multipart/form-data" class="space-y-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class={LABEL}>First name</span>
            <input
              name="firstName"
              value={user.firstName ?? ""}
              class={INPUT}
              autocomplete="given-name"
            />
          </label>
          <label class="block">
            <span class={LABEL}>Last name</span>
            <input
              name="lastName"
              value={user.lastName ?? ""}
              class={INPUT}
              autocomplete="family-name"
            />
          </label>
        </div>
        <label class="block">
          <span class={LABEL}>Bio</span>
          <textarea
            name="bio"
            rows={3}
            class={INPUT}
            placeholder="Short intro shown with your posts"
          >
            {user.bio ?? ""}
          </textarea>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class={LABEL}>Location</span>
            <input
              name="location"
              value={user.location ?? ""}
              class={INPUT}
              placeholder="City, country"
              autocomplete="address-level2"
            />
          </label>
          <label class="block">
            <span class={LABEL}>Website</span>
            <input
              name="website"
              type="url"
              value={user.website ?? ""}
              class={INPUT}
              placeholder="https://…"
            />
          </label>
        </div>
        <label class="block">
          <span class={LABEL}>Public email</span>
          <input
            name="email"
            type="email"
            value={user.email ?? ""}
            class={INPUT}
            placeholder="you@example.com"
            autocomplete="email"
          />
        </label>
        <div>
          <span class={LABEL}>Avatar</span>
          <FilePickField
            name="avatar"
            accept={ACCEPT_IMAGES}
            buttonLabel="Choose avatar"
            hint="PNG, JPG, WebP, GIF or SVG"
            imagePreview
            currentImageUrl={mediaAdminPreviewUrl(user.avatarUrl)}
          />
        </div>
        <SocialLinksFields links={user.socialLinks ?? []} />
        <button type="submit" class={ADMIN_BTN_PRIMARY}>
          Save profile
        </button>
      </form>
    </AdminPage>
  );
});
