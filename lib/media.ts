// Media storage: user uploads under UPLOAD_DIR (default ./static/uploads).
// Stage 7 note: only directory listing lives here (needed by the editor's
// "insert image" modal); upload/validation/delete land in stage 8 (F5).

const uploadDir = Deno.env.get("UPLOAD_DIR") ?? "./static/uploads";

export interface MediaFile {
  name: string;
  url: string;
}

/** All uploaded files, newest first (filenames start with a timestamp). */
export async function listMediaFiles(): Promise<MediaFile[]> {
  const files: MediaFile[] = [];
  try {
    for await (const entry of Deno.readDir(uploadDir)) {
      if (entry.isFile && !entry.name.startsWith(".")) {
        files.push({ name: entry.name, url: `/uploads/${entry.name}` });
      }
    }
  } catch {
    return []; // upload dir may not exist yet
  }
  return files.sort((a, b) => b.name.localeCompare(a.name));
}
