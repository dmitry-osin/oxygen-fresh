import { createDefine } from "fresh";

// Shared state passed between middlewares, layouts and routes.
// Fields are added as features land (e.g. the authenticated admin user).
export type State = object;

export const define = createDefine<State>();
