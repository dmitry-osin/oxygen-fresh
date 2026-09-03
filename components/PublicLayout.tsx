// Public site shell: sticky footer, shared chrome, optional admin bar.

import type { ComponentChildren } from "preact";
import type { Settings } from "@/types/index.ts";
import type { NavLink } from "@/lib/menu.ts";
import { Header } from "./Header.tsx";
import { Footer } from "./Footer.tsx";
import { AdminQuickBar } from "./AdminQuickBar.tsx";
import { PUBLIC_DIVIDER } from "@/lib/public-ui.ts";

export function PublicLayout(
  props: {
    siteName: string;
    logoUrl?: string;
    navLinks: NavLink[];
    socialLinks?: Settings["socialLinks"];
    footerDescription?: string;
    /** Show admin quick actions when the visitor has a valid session. */
    isAdmin?: boolean;
    /** Admin editor URL for the current post/page (Edit current). */
    editHref?: string;
    children: ComponentChildren;
  },
) {
  return (
    <div class="min-h-dvh flex flex-col">
      <div
        class={`sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b ${PUBLIC_DIVIDER}`}
      >
        {props.isAdmin && <AdminQuickBar editHref={props.editHref} />}
        <Header
          navLinks={props.navLinks}
          siteName={props.siteName}
          logoUrl={props.logoUrl}
        />
      </div>
      <div class="flex-1 flex flex-col">{props.children}</div>
      <Footer
        siteName={props.siteName}
        footerDescription={props.footerDescription}
        socialLinks={props.socialLinks}
      />
    </div>
  );
}
