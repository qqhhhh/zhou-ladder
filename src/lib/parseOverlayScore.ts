/**
 * Overlay score text, e.g.
 *   7635
 *   1、风行-26
 *   2、先知-26
 *   3、TB-25
 *   4、斯温+3
 *
 * Trailing [+-]N is a signed score ("-" means negative).
 */

export type OverlayHeroEntry = {
  rank: number;
  name: string;
  value: number;
};

export type OverlayScorePayload = {
  total: number | null;
  heroes: OverlayHeroEntry[];
  rawLines: string[];
  empty: boolean;
  /** ISO time when this payload was ingested (optional). */
  updatedAt?: string;
};

const RANK_LINE =
  /^\s*(\d+)\s*[、,.\.．]\s*(.+?)([+-]\d+)\s*$/u;

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function parseOverlayScore(text: string): OverlayScorePayload {
  const rawLines = normalizeLines(text);
  if (rawLines.length === 0) {
    return { total: null, heroes: [], rawLines: [], empty: true };
  }

  let total: number | null = null;
  const heroes: OverlayHeroEntry[] = [];
  let startIdx = 0;

  if (/^-?\d+$/.test(rawLines[0])) {
    total = Number(rawLines[0]);
    startIdx = 1;
  }

  for (let i = startIdx; i < rawLines.length; i += 1) {
    const m = rawLines[i].match(RANK_LINE);
    if (!m) continue;
    heroes.push({
      rank: Number(m[1]),
      name: m[2].trim(),
      value: Number(m[3]),
    });
  }

  return {
    total,
    heroes,
    rawLines,
    empty: total == null && heroes.length === 0,
  };
}
