import { createDefine } from "fresh";
import type { Settings, User } from "@/types/index.ts";

// Shared state passed between middlewares, layouts and routes.
export interface State {
  /** Authenticated admin user, set by routes/admin/_middleware.ts */
  user?: User;
  /** Site name from settings, for the admin layout brand. */
  siteName?: string;
  /** Admin theme preference from settings (SSR dark class + toggle). */
  theme?: Settings["theme"];
}

export const define = createDefine<State>();
