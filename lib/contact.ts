// Contact form messages stored in Deno KV for the admin inbox.

import { addToList, kv, KvKeys, removeFromList } from "./kv.ts";
import type { ContactMessage } from "@/types/index.ts";
import { nowIso } from "@/utils/date.ts";

export type ContactSubmitResult =
  | { ok: true; message: ContactMessage }
  | { ok: false; error: string };

export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Honeypot — must be empty. */
  website?: string;
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const messages: ContactMessage[] = [];
  const iter = kv.list<ContactMessage>({ prefix: ["contact_messages"] });
  for await (const entry of iter) messages.push(entry.value);
  return messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countUnreadContactMessages(): Promise<number> {
  const messages = await listContactMessages();
  return messages.filter((m) => !m.read).length;
}

export async function submitContactMessage(
  input: ContactInput,
): Promise<ContactSubmitResult> {
  // Bots fill hidden honeypot fields; pretend success.
  if (input.website?.trim()) {
    return {
      ok: true,
      message: {
        id: "honeypot",
        name: "",
        email: "",
        message: "",
        createdAt: nowIso(),
        read: true,
      },
    };
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const subject = input.subject?.trim() || undefined;

  if (!name) return { ok: false, error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid email is required." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Message must be at least 10 characters." };
  }
  if (message.length > 5000) {
    return { ok: false, error: "Message is too long." };
  }

  const entry: ContactMessage = {
    id: crypto.randomUUID(),
    name,
    email,
    subject,
    message,
    createdAt: nowIso(),
    read: false,
  };
  await kv.set(KvKeys.contactMessage(entry.id), entry);
  await addToList(KvKeys.contactMessageIds(), entry.id);
  return { ok: true, message: entry };
}

export async function markContactMessageRead(id: string): Promise<boolean> {
  const entry = await kv.get<ContactMessage>(KvKeys.contactMessage(id));
  if (!entry.value) return false;
  await kv.set(KvKeys.contactMessage(id), { ...entry.value, read: true });
  return true;
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const entry = await kv.get<ContactMessage>(KvKeys.contactMessage(id));
  if (!entry.value) return false;
  await kv.delete(KvKeys.contactMessage(id));
  await removeFromList(KvKeys.contactMessageIds(), id);
  return true;
}
