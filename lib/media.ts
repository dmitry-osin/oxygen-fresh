// Media storage: user uploads under UPLOAD_DIR (default ./static/uploads).
// Source: ai/requirements.md F5 (section 7.1) and the security checklist
// (section 10): MIME check, extension check, size <= 5MB, safe filename.

const uploadDir = Deno.env.get("UPLOAD_DIR") ?? "./static/uploads";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/** Allowed MIME types mapped to the extension the saved file must carry. */
const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const SAFE_NAME = /^[a-z0-9][a-z0-9.-]*$/;

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export interface MediaFile {
  name: string;
  url: string;
  /** Authenticated preview URL for the admin UI (Vite static can miss uploads). */
  adminUrl: string;
}

/**
 * Marker so main.ts can replace the app-wide CSP for raw upload bytes.
 * The global CSP keeps a literal 'unsafe-inline' fallback for script-src
 * (browsers without nonce support), which — with no nonce attached to a
 * plain `new Response(...)` — would let an SVG upload's inline <script>
 * execute if someone navigates straight to /uploads/<file>.svg. This
 * response-specific CSP blocks all script execution unconditionally
 * regardless of file content, mirroring the BLANK_PAGE_CSP pattern in
 * lib/blank-page.ts.
 */
export const RAW_UPLOAD_HEADER = "X-Oxygen-Raw-Upload";
export const RAW_UPLOAD_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:";

export type SaveMediaResult =
  | { ok: true; file: MediaFile }
  | { ok: false; error: string };

function toMediaFile(name: string): MediaFile {
  return {
    name,
    url: `/uploads/${name}`,
    adminUrl: `/admin/api/media/file?name=${encodeURIComponent(name)}`,
  };
}

/** MIME type from a stored filename extension. */
export function mimeForFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot === -1 ? "" : name.slice(dot).toLowerCase();
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}

/** Read a stored upload; rejects path traversal. */
export async function readMediaFile(
  name: string,
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!SAFE_NAME.test(name) || name.includes("..")) return null;
  try {
    const bytes = await Deno.readFile(`${uploadDir}/${name}`);
    return { bytes, mime: mimeForFileName(name) };
  } catch {
    return null;
  }
}

/** All uploaded files, newest first (filenames start with a timestamp). */
export async function listMediaFiles(): Promise<MediaFile[]> {
  const files: MediaFile[] = [];
  try {
    for await (const entry of Deno.readDir(uploadDir)) {
      if (entry.isFile && !entry.name.startsWith(".")) {
        files.push(toMediaFile(entry.name));
      }
    }
  } catch {
    return []; // upload dir may not exist yet
  }
  return files.sort((a, b) => b.name.localeCompare(a.name));
}

/** Lowercase alphanumeric + dash + dot; everything else becomes a dash. */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[.-]+/, "");
}

/** Error message when the upload is unacceptable, null when it is fine. */
export function validateUpload(type: string, size: number, name: string) {
  if (size <= 0 || size > MAX_FILE_SIZE) {
    return "File must be between 1 byte and 5MB.";
  }
  const ext = MIME_TO_EXT[type];
  if (!ext) return "Unsupported type. Allowed: PNG, JPG, WebP, GIF, SVG.";
  const sanitized = sanitizeFileName(name);
  if (!sanitized) return "File name is unusable.";
  const originalExt = `.${name.split(".").pop()?.toLowerCase()}`;
  if (originalExt !== ext && !(ext === ".jpg" && originalExt === ".jpeg")) {
    return `Extension must match the file type (${ext}).`;
  }
  return null;
}

/** Validate and store an uploaded file as `{timestamp}-{safe-name}`. */
export async function saveMediaFile(file: File): Promise<SaveMediaResult> {
  const error = validateUpload(file.type, file.size, file.name);
  if (error) return { ok: false, error };
  const ext = MIME_TO_EXT[file.type];
  const base = sanitizeFileName(file.name)
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/-+$/, "");
  const stored = { name: `${Date.now()}-${base}${ext}` };
  try {
    await Deno.mkdir(uploadDir, { recursive: true });
    await Deno.writeFile(
      `${uploadDir}/${stored.name}`,
      new Uint8Array(await file.arrayBuffer()),
      { createNew: true }, // never overwrite an existing upload
    );
  } catch {
    return { ok: false, error: "Could not store the file." };
  }
  return { ok: true, file: toMediaFile(stored.name) };
}

/** Delete an upload by name. Path traversal is rejected by SAFE_NAME. */
export async function deleteMediaFile(name: string): Promise<boolean> {
  if (!SAFE_NAME.test(name) || name.includes("..")) return false;
  try {
    await Deno.remove(`${uploadDir}/${name}`);
    return true;
  } catch {
    return false;
  }
}
