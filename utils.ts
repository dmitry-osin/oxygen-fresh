import { createDefine } from "fresh";
import type { User } from "@/types/index.ts";

// Shared state passed between middlewares, layouts and routes.
export interface State {
  /** Authenticated admin user, set by routes/admin/_middleware.ts */
  user?: User;
}

export const define = createDefine<State>();
