import { equal, match, throws } from "node:assert/strict";
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from "./session-cookie.ts";

const token = "ab".repeat(32);
const secret = "test-session-secret-32-characters-long";

function withEnv(run: () => void): void {
  const names = ["SESSION_SECRET", "SITE_URL"];
  const previous = names.map((name) => Deno.env.get(name));
  try {
    Deno.env.set("SESSION_SECRET", secret);
    Deno.env.set("SITE_URL", "https://blog.example.com");
    run();
  } finally {
    names.forEach((name, i) => {
      const value = previous[i];
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    });
  }
}

function cookie(): string {
  const headers = new Headers();
  setSessionCookie(headers, token);
  return headers.get("set-cookie")!;
}

function read(value: string): string | undefined {
  return readSessionToken(new Headers({ cookie: value }));
}

Deno.test("signed session cookie round-trips with security attributes", () => {
  withEnv(() => {
    const value = cookie();
    match(value, /^session=[0-9a-f]{64}\.[0-9a-f]{64};/);
    match(
      value,
      /; Path=\/; HttpOnly; SameSite=Strict; Max-Age=604800; Secure$/,
    );
    equal(read(`other=value; ${value.split(";")[0]}; theme=dark`), token);
    equal(
      read(`session=${encodeURIComponent(value.split(";")[0].slice(8))}`),
      token,
    );
    Deno.env.set("SITE_URL", "http://localhost:5173");
    equal(cookie().includes("; Secure"), false);
  });
});

Deno.test("modified tokens, signatures and rotated secrets are rejected", () => {
  withEnv(() => {
    const value = cookie().split(";")[0];
    equal(read(value.replace(token, "cd".repeat(32))), undefined);
    const tail = value.endsWith("0") ? "1" : "0";
    equal(read(value.slice(0, -1) + tail), undefined);
    Deno.env.set("SESSION_SECRET", "a-different-session-secret-32-characters");
    equal(read(value), undefined);
    equal(read(cookie().split(";")[0]), token);
  });
});

Deno.test("unsigned, malformed and missing session cookies are rejected", () => {
  withEnv(() => {
    for (
      const value of [
        `session=${token}`,
        "session=",
        "session=%ZZ",
        "session=%E0%A4",
        `session=${token}.abc`,
        cookie().split(";")[0] + ".extra",
        "other=value",
      ]
    ) {
      equal(read(value), undefined);
    }
    equal(readSessionToken(new Headers()), undefined);
  });
});

Deno.test("signing and verifying require a secret of at least 32 characters", () => {
  withEnv(() => {
    const value = cookie().split(";")[0];
    for (const invalid of [undefined, "", "112233445566", "a".repeat(31)]) {
      if (invalid === undefined) Deno.env.delete("SESSION_SECRET");
      else Deno.env.set("SESSION_SECRET", invalid);
      throws(cookie, /SESSION_SECRET must contain at least 32 characters/);
      throws(
        () => read(value),
        /SESSION_SECRET must contain at least 32 characters/,
      );
    }
    Deno.env.set("SESSION_SECRET", "a".repeat(32));
    equal(read(cookie().split(";")[0]), token);
  });
});

Deno.test("logout expires a signed cookie even without a signing secret", () => {
  withEnv(() => {
    const headers = new Headers();
    Deno.env.delete("SESSION_SECRET");
    clearSessionCookie(headers);
    equal(
      headers.get("set-cookie"),
      "session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
    );
    equal(read(headers.get("set-cookie")!), undefined);
  });
});
