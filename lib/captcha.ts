// Simple math captcha for the public contact form (self-hosted, no third party).

import { kv, KvKeys } from "./kv.ts";

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

export interface MathCaptchaChallenge {
  token: string;
  /** Human-readable question, e.g. "3 + 7". */
  question: string;
}

/** Create a one-time a+b challenge stored in KV until answered or expired. */
export async function createMathCaptcha(): Promise<MathCaptchaChallenge> {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const token = crypto.randomUUID();
  await kv.set(
    KvKeys.captcha(token),
    { answer: a + b },
    { expireIn: CAPTCHA_TTL_MS },
  );
  return { token, question: `${a} + ${b}` };
}

/** Verify and consume the challenge. Wrong/missing/expired → false. */
export async function verifyMathCaptcha(
  token: string,
  answerRaw: string,
): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) return false;
  const key = KvKeys.captcha(trimmed);
  const entry = await kv.get<{ answer: number }>(key);
  await kv.delete(key);
  if (!entry.value) return false;
  const n = Number(String(answerRaw).trim());
  return Number.isInteger(n) && n === entry.value.answer;
}
