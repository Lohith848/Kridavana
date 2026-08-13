// Server-side only. Never import this from a client component — the
// TheGamesDB API key must never reach the browser.
//
// This module is the single integration point for TheGamesDB. Everything it
// returns is a Kridavana-internal game model; no TheGamesDB response shape
// ever leaks into the UI. Swapping providers later means rewriting only this
// file (plus the games table's external id column).

const BASE = 'https://api.thegamesdb.net/v1';
const IMAGE_BASE = 'https://cdn.thegamesdb.net/images/original/';

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

type TdbImageEntry = {
  id?: number;
  type?: string;
  side?: string | null;
  filename?: string;
  url?: string;
  resolution?: string | null;
  rating?: string | null;
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
    images?: Record<string, Record<string, unknown>>;
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

  return res.json();
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
export function imageUrl(filename?: string | null): string | null {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${IMAGE_BASE}${filename}`;
}

/** Best poster: front boxart, then fanart, then banner, then screenshot. */
function pickCover(images: Record<string, unknown> | undefined): string | null {
  if (!images) return null;

  const boxart = images.boxart as
    | { front?: TdbImageEntry; back?: TdbImageEntry }
    | undefined;
  if (boxart?.front?.url) return imageUrl(boxart.front.url);
  if (boxart?.back?.url) return imageUrl(boxart.back.url);

  for (const type of ['fanart', 'banner', 'screenshot'] as const) {
    const list = images[type] as TdbImageEntry[] | undefined;
    const first = Array.isArray(list) ? list[0] : undefined;
    if (first?.url) return imageUrl(first.url);
    if (first?.filename) return imageUrl(first.filename);
  }

  return null;
}

/** First available fanart/banner for a wide hero image. */
function pickBackground(images: Record<string, unknown> | undefined): string | null {
  if (!images) return null;
  for (const type of ['fanart', 'banner'] as const) {
    const list = images[type] as TdbImageEntry[] | undefined;
    const first = Array.isArray(list) ? list[0] : undefined;
    if (first?.url) return imageUrl(first.url);
    if (first?.filename) return imageUrl(first.filename);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public adapter API
// ---------------------------------------------------------------------------

/**
 * Search games by name. Returns normalized results (no pagination needed for
 * the search dropdown — the API defaults to a reasonable page).
 */
export async function searchGames(query: string, limit = 20): Promise<Game[]> {
  const data = await tdbGet('/Games/ByGameName', {
    name: query,
    fields: 'players,publishers,genres,overview,rating,platform,youtube',
    include: 'boxart,platform,genres,developers,publishers'
  });

  const games = data.data?.games ?? [];
  const include = data.include ?? {};

  return games.slice(0, limit).map((g) => normalize(g, include));
}

/** Fetch detailed game info (overview + genres + platforms + images + trailer). */
export async function getGameById(id: number): Promise<Game | null> {
  const [detail, images, videos] = await Promise.allSettled([
    tdbGet('/Games/ByGameID', {
      id,
      fields: 'players,publishers,genres,overview,rating,platform,youtube',
      include: 'platform,genres,developers,publishers'
    }),
    getGameImages(id),
    getGameVideos(id)
  ]);

  if (detail.status !== 'fulfilled') return null;
  const game = detail.value.data?.games?.[0];
  if (!game) return null;

  const normalized = normalize(game, detail.value.include ?? {});

  // images / videos are best-effort — never fail the page because of them
  const imageData =
    images.status === 'fulfilled' && images.value
      ? (images.value as Record<string, unknown>)
      : undefined;
  const videoData = videos.status === 'fulfilled' ? videos.value : undefined;

  return {
    ...normalized,
    cover_url: normalized.cover_url ?? pickCover(imageData),
    youtube: normalized.youtube ?? videoData?.youtube ?? null
  };
}

/** Raw image set for a game (internal; used by getGameById). */
export async function getGameImages(id: number): Promise<Record<string, unknown> | null> {
  const data = await tdbGet('/Games/Images', { games_id: id });
  const images = data.data?.images?.[String(id)] ?? data.data?.images?.[id];
  if (!images) return null;
  // attach the full cover/background URLs to a normalized shape
  return {
    ...images,
    cover_url: pickCover(images as Record<string, unknown>),
    background_url: pickBackground(images as Record<string, unknown>)
  };
}

/** Trailer info for a game (internal; used by getGameById). */
export async function getGameVideos(id: number): Promise<{ youtube: string | null } | null> {
  const data = await tdbGet('/Games/Videos', { games_id: id });
  const list = data.data?.videos?.[String(id)] ?? data.data?.videos?.[id] ?? [];
  const first = Array.isArray(list) ? list[0] : undefined;
  return { youtube: first?.youtube || null };
}

// ---------------------------------------------------------------------------
// Normalization: TheGamesDB → Kridavana Game
// ---------------------------------------------------------------------------
function normalize(g: TdbGame, include: TdbInclude): Game {
  const genres = (g.genres ?? []).map((id) => include.genres?.data?.[String(id)]?.name ?? '').filter(Boolean);
  const platforms = g.platform ? [include.platform?.data?.[String(g.platform)]?.name ?? ''].filter(Boolean) : [];
  const developers = (g.developers ?? []).map((id) => include.developers?.data?.[String(id)]?.name ?? '').filter(Boolean);
  const publishers = (g.publishers ?? []).map((id) => include.publishers?.data?.[String(id)]?.name ?? '').filter(Boolean);

  const boxart = include.boxart?.data?.[String(g.id)];
  const front = Array.isArray(boxart) ? boxart.find((b) => b.side === 'front') : undefined;

  return {
    id: g.id,
    name: g.game_title ?? `Game ${g.id}`,
    summary: g.overview?.trim() || null,
    cover_url: front ? imageUrl(front.filename) : null,
    first_release_date: g.release_date || null,
    genres,
    platforms,
    developer: developers[0] ?? null,
    publishers,
    rating: g.rating?.trim() || null,
    youtube: g.youtube?.trim() || null
  };
}
