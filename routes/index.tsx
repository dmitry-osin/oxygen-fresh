import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

// Blog index placeholder. Replaced by the paginated post list in a later stage.
export default define.page(function Home() {
  return (
    <div class="px-4 py-8 mx-auto max-w-screen-md">
      <Head>
        <title>oxygen-blog</title>
      </Head>
      <h1 class="text-4xl font-bold">oxygen-blog</h1>
      <p class="my-4">Blog engine is under construction.</p>
    </div>
  );
});
