// Server-side only. Never import this from a client component — the
// TheGamesDB API key must never reach the browser.
//
// This module is the single integration point for TheGamesDB. Everything it
// returns is a Kridavana-internal game model; no TheGamesDB response shape
// ever leaks into the UI. Swapping providers later means rewriting only this
// file (plus the games table's external id column).

import { imageUrl, pickCoverCandidates, pickBestVerifiedUrl, type TdbImageEntry } from './thegamesdb-images';

const BASE = 'https://api.thegamesdb.net/v1';

// ---------------------------------------------------------------------------
// Kridavana's internal game model (also mirrors the `games` table)
// ---------------------------------------------------------------------------
export type Game = {
  /** TheGamesDB game id — the external provider id */
  id: number;
  name: string;
  summary: string | null;
  cover_url: string | null;
  first_release_date: string | null; // YYYY-MM-DD
  genres: string[];
  platforms: string[];
  developer: string | null;
  publishers: string[];
  /** ESRB / PEGI content rating string, e.g. "T - Teen" */
  rating: string | null;
  /** YouTube video id for the official trailer, if any */
  youtube: string | null;
};

// ---------------------------------------------------------------------------
// TheGamesDB wire types — kept separate from the internal model
// ---------------------------------------------------------------------------
type TdbGame = {
  id: number;
  game_title: string;
  release_date?: string;
  overview?: string;
  platform?: number | null;
  genres?: number[] | null;
  developers?: number[] | null;
  publishers?: number[] | null;
  rating?: string | null;
  youtube?: string | null;
  last_updated?: string;
};

type TdbVideoEntry = {
  id: number;
  name: string;
  youtube: string;
};

type TdbInclude = {
  boxart?: { base_url?: { original?: string; thumb?: string }; data?: Record<string, TdbImageEntry[]> };
  platform?: { data?: Record<string, { name?: string }> };
  genres?: { data?: Record<string, { name?: string }> };
  developers?: { data?: Record<string, { name?: string }> };
  publishers?: { data?: Record<string, { name?: string }> };
};

type TdbResponse = {
  code: number;
  status: string;
  data?: {
    count?: number;
    pages?: number;
    games?: TdbGame[];
    base_url?: { original?: string; thumb?: string };
    images?: Record<string, TdbImageEntry[]>;
    videos?: Record<string, TdbVideoEntry[]>;
  };
  include?: TdbInclude;
};

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------
async function tdbGet(path: string, params: Record<string, string | number>): Promise<TdbResponse> {
  const key = process.env.THEGAMESDB_API_KEY;
  if (!key) {
    throw new Error('THEGAMESDB_API_KEY is not set — add it to .env.local (free at thegamesdb.net)');
  }

  const qs = new URLSearchParams();
  qs.set('apikey', key);
  for (const [k, v] of Object.entries(params)) qs.set(k, String(v));

  const res = await fetch(`${BASE}${path}?${qs.toString()}`, {
    // short-lived cache for search; game details are cached in Supabase instead
    next: { revalidate: 300 }
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('TheGamesDB rejected the API key.');
  }
  if (res.status === 429) {
    throw new Error('TheGamesDB rate limit reached — try again in a minute.');
  }
  if (!res.ok) {
    throw new Error(`TheGamesDB request to ${path} failed: ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    throw new Error(`TheGamesDB returned an unreadable response from ${path}.`);
  }
}

// ---------------------------------------------------------------------------
// Image caching (in-process) — avoids duplicate /Games/Images requests
// ---------------------------------------------------------------------------
const imageCache = new Map<number, { at: number; entries: TdbImageEntry[]; baseUrl?: string }>();
const IMAGE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Raw image set for a game from /Games/Images.
 * The endpoint returns one flat array of entries per game id:
 *   data.images[id] = [{ type: 'boxart', side: 'front', filename }, …]
 */
export async function getGameImages(id: number): Promise<{ entries: TdbImageEntry[]; baseUrl?: string } | null> {
  const cached = imageCache.get(id);
  if (cached && Date.now() - cached.at < IMAGE_CACHE_TTL) return cached;

  const data = await tdbGet('/Games/Images', { games_id: id });
  const entries = data.data?.images?.[String(id)];

  if (!Array.isArray(entries) || entries.length === 0) {
    console.warn(`[thegamesdb] no images found for game ${id}`);
    imageCache.set(id, { at: Date.now(), entries: [] });
    return null;
  }

  const baseUrl = data.data?.base_url?.original;
  console.log(
    `[thegamesdb] images #${id}: ${entries.length} entries` +
      ` (${[...new Set(entries.map((e) => e.type))].join(', ')})` +
      `, base_url ${baseUrl ?? 'default'}`
  );

  const result = { entries, baseUrl };
  imageCache.set(id, { at: Date.now(), ...result });
  return result;
}

/** Trailer info for a game (internal; used by getGameById). */
export async function getGameVideos(id: number): Promise<{ youtube: string | null } | null> {
  const data = await tdbGet('/Games/Videos', { games_id: id });
  const list = data.data?.videos?.[String(id)] ?? data.data?.videos?.[id] ?? [];
  const first = Array.isArray(list) ? list[0] : undefined;
  return { youtube: first?.youtube || null };
}

// ---------------------------------------------------------------------------
// Public adapter API
// ---------------------------------------------------------------------------

/**
 * Search games by name. Returns normalized results (no pagination needed for
 * the search dropdown — the API defaults to a reasonable page).
 * Covers come straight from the response's boxart include (fast path).
 */
export async function searchGames(query: string, limit = 20): Promise<Game[]> {
  const data = await tdbGet('/Games/ByGameName', {
    name: query,
    fields: 'players,publishers,genres,overview,rating,platform,youtube',
    include: 'boxart,platform,genres,developers,publishers'
  });

  const games = data.data?.games ?? [];
  const include = data.include ?? {};

  const results = games.slice(0, limit).map((g) => normalize(g, include));

  const sample = results.find((r) => r.cover_url);
  console.log(
    `[thegamesdb] search "${query}": ${results.length} results` +
      (sample ? `, e.g. "${sample.name}" cover ${sample.cover_url}` : ', no covers in include')
  );

  return results;
}

/** Fetch detailed game info (overview + genres + platforms + images + trailer). */
export async function getGameById(id: number): Promise<Game | null> {
  const [detail, images, videos] = await Promise.allSettled([
    tdbGet('/Games/ByGameID', {
      id,
      fields: 'players,publishers,genres,overview,rating,platform,youtube',
      include: 'boxart,platform,genres,developers,publishers'
    }),
    getGameImages(id),
    getGameVideos(id)
  ]);

  if (detail.status !== 'fulfilled') return null;
  const game = detail.value.data?.games?.[0];
  if (!game) return null;

  const normalized = normalize(game, detail.value.include ?? {});

  // Images / videos are best-effort — never fail the page because of them.
  const imageResult = images.status === 'fulfilled' ? images.value : null;
  const videoData = videos.status === 'fulfilled' ? videos.value : undefined;

  // Cover: prefer the boxart that came with ByGameID (fast path), otherwise
  // pull from /Games/Images. Either way, verify the URL and walk the fallback
  // chain (front boxart → back → fanart → banner → screenshot) on a 404.
  const candidates = normalized.cover_url
    ? [normalized.cover_url]
    : pickCoverCandidates(imageResult?.entries ?? undefined);
  const coverUrl = await pickBestVerifiedUrl(candidates, imageResult?.baseUrl, `cover #${id}`);

  return {
    ...normalized,
    cover_url: coverUrl,
    youtube: normalized.youtube ?? videoData?.youtube ?? null
  };
}

// ---------------------------------------------------------------------------
// Normalization: TheGamesDB → Kridavana Game
// ---------------------------------------------------------------------------
function normalize(g: TdbGame, include: TdbInclude): Game {
  const genres = (g.genres ?? []).map((id) => include.genres?.data?.[String(id)]?.name ?? '').filter(Boolean);
  const platforms = g.platform ? [include.platform?.data?.[String(g.platform)]?.name ?? ''].filter(Boolean) : [];
  const developers = (g.developers ?? []).map((id) => include.developers?.data?.[String(id)]?.name ?? '').filter(Boolean);
  const publishers = (g.publishers ?? []).map((id) => include.publishers?.data?.[String(id)]?.name ?? '').filter(Boolean);

  // include.boxart.data[gameId] is a flat array of { type, side, filename } —
  // pick the best poster (front boxart first) and resolve it against the
  // base_url that ships with the include.
  const boxartEntries = include.boxart?.data?.[String(g.id)];
  const cover = pickCoverCandidates(boxartEntries)[0];

  return {
    id: g.id,
    name: g.game_title ?? `Game ${g.id}`,
    summary: g.overview?.trim() || null,
    cover_url: cover ? imageUrl(cover, include.boxart?.base_url?.original) : null,
    first_release_date: g.release_date || null,
    genres,
    platforms,
    developer: developers[0] ?? null,
    publishers,
    rating: g.rating?.trim() || null,
    youtube: g.youtube?.trim() || null
  };
}
