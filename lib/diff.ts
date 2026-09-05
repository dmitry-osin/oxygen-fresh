// Line diff for the version comparison view (F19).
// Classic LCS dynamic programming: posts are small (hundreds of lines),
// so an (n+1) x (m+1) table is fine and the implementation stays
// dependency-free.

export type DiffKind = "same" | "added" | "removed";

export interface DiffRow {
  left: string | null;
  right: string | null;
  kind: DiffKind;
}

/** table[i][j] = length of the longest common subsequence of a[i:], b[j:]. */
function lcsTable(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from(
    { length: a.length + 1 },
    () => new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

/** Walk the LCS table emitting same / removed / added rows in order. */
function walkDiff(a: string[], b: string[], table: number[][]): DiffRow[] {
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ left: a[i], right: b[j], kind: "same" });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ left: a[i], right: null, kind: "removed" });
      i++;
    } else {
      rows.push({ left: null, right: b[j], kind: "added" });
      j++;
    }
  }
  for (; i < a.length; i++) {
    rows.push({ left: a[i], right: null, kind: "removed" });
  }
  for (; j < b.length; j++) {
    rows.push({ left: null, right: b[j], kind: "added" });
  }
  return rows;
}

/** Side-by-side line diff of two texts. */
export type DiffResult =
  | { ok: true; rows: DiffRow[] }
  | { ok: false; reason: "too-large" };

// Deno runs JS on a single thread: the LCS table is O(n*m) time AND
// memory, computed synchronously with no yield point, so it blocks every
// other request (including the public site, if it shares the process)
// until it finishes. A pasted/imported document with thousands of lines
// published twice would otherwise be able to hang the whole server.
export const MAX_DIFF_LINES = 5000;

export function diffLines(left: string, right: string): DiffResult {
  const a = left.split("\n");
  const b = right.split("\n");
  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) {
    return { ok: false, reason: "too-large" };
  }
  return { ok: true, rows: walkDiff(a, b, lcsTable(a, b)) };
}
