import { App, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { startScheduler } from "./lib/scheduler.ts";

export const app = new App<State>();

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();

// Scheduled posts (F20): publish due posts on start and every hour.
startScheduler();
