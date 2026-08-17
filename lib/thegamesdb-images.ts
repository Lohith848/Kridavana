/**
 * lib/thegamesdb-images.ts
 *
 * Pure image utilities for the TheGamesDB provider. Server-side only.
 *
 * Every TheGamesDB image payload shares one shape — a flat array of entries:
 *   { id, type, side, filename, ... }
 * That includes `include.boxart.data[gameId]` (search & ByGameID) and
 * `data.images[gameId]` from /Games/Images. This module turns those arrays
 * into full CDN URLs and picks the best poster for a game.
 */

export const TDB_IMAGE_BASE = 'https://cdn.thegamesdb.net/images/original/';

export type TdbImageEntry = {
  id?: number;
  type?: string;
  side?: string | null;
  filename?: string;
  url?: string;
  resolution?: string | null;
};

// ---------------------------------------------------------------------------
// URL construction
// ---------------------------------------------------------------------------

/** Full image URL from a (relative) filename. Absolute http(s) URLs pass through. */
export function imageUrl(filename?: string | null, baseUrl?: string | null): string | null {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename)) return filename;
  const base = baseUrl || TDB_IMAGE_BASE;
  return `${base}${filename}`;
}

// ---------------------------------------------------------------------------
// Candidate picking (preference order)
// ---------------------------------------------------------------------------

/** Filenames for one image type, optionally filtered by side. */
function filesFor(entries: TdbImageEntry[] | undefined, type: string, side?: string): string[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => e?.type === type && (side ? e?.side === side : true))
    .map((e) => e?.filename || e?.url)
    .filter((f): f is string => !!f);
}

/**
 * Poster candidates in preference order:
 * front boxart → back boxart → any boxart → fanart → banner → screenshot.
 */
export function pickCoverCandidates(entries: TdbImageEntry[] | undefined): string[] {
  if (!Array.isArray(entries)) return [];
  return [
    ...filesFor(entries, 'boxart', 'front'),
    ...filesFor(entries, 'boxart', 'back'),
    ...filesFor(entries, 'boxart'),
    ...filesFor(entries, 'fanart'),
    ...filesFor(entries, 'banner'),
    ...filesFor(entries, 'screenshot')
  ];
}

/** Wide hero candidates: fanart → banner → front boxart → screenshot. */
export function pickBackgroundCandidates(entries: TdbImageEntry[] | undefined): string[] {
  if (!Array.isArray(entries)) return [];
  return [
    ...filesFor(entries, 'fanart'),
    ...filesFor(entries, 'banner'),
    ...filesFor(entries, 'boxart', 'front'),
    ...filesFor(entries, 'screenshot')
  ];
}

// ---------------------------------------------------------------------------
// URL verification with fallback + caching
// ---------------------------------------------------------------------------

/** Memoized outcome of checking a URL — avoids re-hitting the CDN. */
const urlCheckCache = new Map<string, boolean>();

/** HEAD-request a CDN image; the result is memoized for the process lifetime. */
export async function verifyImageUrl(url: string): Promise<boolean> {
  const cached = urlCheckCache.get(url);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const ok = res.ok;
    urlCheckCache.set(url, ok);
    return ok;
  } catch {
    urlCheckCache.set(url, false);
    return false;
  }
}

/**
 * First candidate that verifies as a live image. Every candidate is logged;
 * a failing one triggers the next. Returns null only when nothing verifies
 * (callers then show the placeholder).
 */
export async function pickBestVerifiedUrl(
  candidates: string[],
  baseUrl?: string | null,
  label = 'image'
): Promise<string | null> {
  for (const filename of candidates) {
    const url = imageUrl(filename, baseUrl);
    if (!url) continue;
    if (await verifyImageUrl(url)) {
      console.log(`[thegamesdb] ${label} → ${url}`);
      return url;
    }
    console.warn(`[thegamesdb] ${label} unavailable (${url}), trying next candidate…`);
  }
  if (candidates.length > 0) {
    console.warn(`[thegamesdb] ${label}: no candidate verified — showing placeholder`);
  }
  return null;
}
