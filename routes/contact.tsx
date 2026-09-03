// Public contact form. Enabled via Settings; linked from the header menu.

import { Head } from "fresh/runtime";
import { HttpError } from "fresh";
import { define } from "@/utils.ts";
import { getNavLinks } from "@/lib/menu.ts";
import { getSettings } from "@/lib/settings.ts";
import { submitContactMessage } from "@/lib/contact.ts";
import { createMathCaptcha, verifyMathCaptcha } from "@/lib/captcha.ts";
import { PublicLayout } from "@/components/PublicLayout.tsx";
import {
  PUBLIC_BTN,
  PUBLIC_INPUT,
  PUBLIC_MAIN_PY,
  PUBLIC_SHELL,
  PUBLIC_TYPE_MUTED,
  PUBLIC_TYPE_PAGE_TITLE,
} from "@/lib/public-ui.ts";
import type { MathCaptchaChallenge } from "@/lib/captcha.ts";
import type { Settings } from "@/types/index.ts";

const LABEL = "block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200";

interface FormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

async function pageData(
  settings: Settings,
  opts: {
    error: string | null;
    sent: boolean;
    isAdmin: boolean;
    values?: FormValues;
  },
) {
  const navLinks = await getNavLinks();
  const captcha = settings.contactCaptchaEnabled
    ? await createMathCaptcha()
    : null;
  return {
    data: {
      settings,
      navLinks,
      captcha,
      error: opts.error,
      sent: opts.sent,
      isAdmin: opts.isAdmin,
      values: opts.values ?? { name: "", email: "", subject: "", message: "" },
    },
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const settings = await getSettings();
    if (!settings.contactFormEnabled) throw new HttpError(404);
    return await pageData(settings, {
      error: null,
      sent: ctx.url.searchParams.get("sent") === "1",
      isAdmin: !!ctx.state.user,
    });
  },

  async POST(ctx) {
    const settings = await getSettings();
    if (!settings.contactFormEnabled) throw new HttpError(404);
    const form = await ctx.req.formData();
    const values: FormValues = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    if (settings.contactCaptchaEnabled) {
      const ok = await verifyMathCaptcha(
        String(form.get("captchaToken") ?? ""),
        String(form.get("captchaAnswer") ?? ""),
      );
      if (!ok) {
        return await pageData(settings, {
          error: "Incorrect captcha answer. Please try again.",
          sent: false,
          isAdmin: !!ctx.state.user,
          values,
        });
      }
    }

    const result = await submitContactMessage({
      ...values,
      website: String(form.get("website") ?? ""),
    });
    if (!result.ok) {
      return await pageData(settings, {
        error: result.error,
        sent: false,
        isAdmin: !!ctx.state.user,
        values,
      });
    }
    return ctx.redirect("/contact?sent=1");
  },
});

export default define.page<typeof handler>(function ContactPage({ data }) {
  const { settings, navLinks, captcha, error, sent, isAdmin, values } = data;
  const title = settings.contactFormLabel || "Contact";
  return (
    <>
      <Head>
        <title>{title} - {settings.siteName}</title>
      </Head>
      <PublicLayout
        siteName={settings.siteName}
        logoUrl={settings.logoUrl}
        navLinks={navLinks}
        socialLinks={settings.socialLinks}
        footerDescription={settings.footerDescription}
        isAdmin={isAdmin}
      >
        <main class={`flex-1 ${PUBLIC_SHELL} ${PUBLIC_MAIN_PY}`}>
          <div class="w-full max-w-xl">
            <h1 class={`${PUBLIC_TYPE_PAGE_TITLE} mb-4`}>{title}</h1>
            {settings.contactFormIntro && (
              <p class={`${PUBLIC_TYPE_MUTED} mb-8`}>
                {settings.contactFormIntro}
              </p>
            )}
            {sent && (
              <p class="text-sm text-green-700 dark:text-green-400 mb-6">
                Thanks — your message was sent.
              </p>
            )}
            {error && <p class="text-sm text-red-600 mb-6">{error}</p>}
            {!sent && (
              <form method="post" class="space-y-4">
                {/* Honeypot for bots — hidden from people */}
                <label class="hidden" aria-hidden="true">
                  <span>Website</span>
                  <input
                    type="text"
                    name="website"
                    tabindex={-1}
                    autocomplete="off"
                  />
                </label>
                <label class="block">
                  <span class={LABEL}>Name *</span>
                  <input
                    name="name"
                    required
                    maxlength={120}
                    class={PUBLIC_INPUT}
                    autocomplete="name"
                    value={values.name}
                  />
                </label>
                <label class="block">
                  <span class={LABEL}>Email *</span>
                  <input
                    name="email"
                    type="email"
                    required
                    maxlength={200}
                    class={PUBLIC_INPUT}
                    autocomplete="email"
                    value={values.email}
                  />
                </label>
                <label class="block">
                  <span class={LABEL}>Subject</span>
                  <input
                    name="subject"
                    maxlength={200}
                    class={PUBLIC_INPUT}
                    value={values.subject}
                  />
                </label>
                <label class="block">
                  <span class={LABEL}>Message *</span>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    maxlength={5000}
                    class={PUBLIC_INPUT}
                  >
                    {values.message}
                  </textarea>
                </label>
                {captcha && <CaptchaFields captcha={captcha} />}
                <button type="submit" class={PUBLIC_BTN}>
                  Send message
                </button>
              </form>
            )}
          </div>
        </main>
      </PublicLayout>
    </>
  );
});

function CaptchaFields({ captcha }: { captcha: MathCaptchaChallenge }) {
  return (
    <label class="block">
      <span class={LABEL}>What is {captcha.question}? *</span>
      <input type="hidden" name="captchaToken" value={captcha.token} />
      <input
        name="captchaAnswer"
        type="text"
        inputMode="numeric"
        required
        autocomplete="off"
        class={PUBLIC_INPUT}
        placeholder="Answer"
      />
    </label>
  );
}
