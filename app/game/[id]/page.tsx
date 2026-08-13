import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGameById } from '@/lib/thegamesdb';
import LogForm from '@/components/log-form';
import WatchlistButton from '@/components/watchlist-button';
import AddToListButton from '@/components/add-to-list-button';
import ReviewFeed from '@/components/review-feed';

export const dynamic = 'force-dynamic';

async function getOrCacheGame(thegamesdbId: number) {
  const supabase = createClient();

  const { data: cached } = await supabase
    .from('games')
    .select('*')
    .eq('thegamesdb_id', thegamesdbId)
    .maybeSingle();
  if (cached) return cached;

  const fresh = await getGameById(thegamesdbId);
  if (!fresh) return null;

  const record = {
    thegamesdb_id: fresh.id,
    name: fresh.name,
    cover_url: fresh.cover_url,
    summary: fresh.summary,
    first_release_date: fresh.first_release_date,
    genres: fresh.genres,
    platforms: fresh.platforms,
    developer: fresh.developer,
    publishers: fresh.publishers,
    rating: fresh.rating,
    youtube: fresh.youtube
  };

  const { data: inserted } = await supabase.from('games').insert(record).select('*').single();
  return inserted ?? record;
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const thegamesdbId = Number(params.id);
  if (Number.isNaN(thegamesdbId)) notFound();

  const game = await getOrCacheGame(thegamesdbId);
  if (!game) notFound();

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let existingLog = null;
  let onWatchlist = false;
  let currentUsername: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
    currentUsername = profile?.username ?? null;

    const { data: localGame } = await supabase
      .from('games')
      .select('id')
      .eq('thegamesdb_id', thegamesdbId)
      .single();
    if (localGame) {
      const { data: log } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', localGame.id)
        .maybeSingle();
      existingLog = log;

      const { data: wl } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('game_id', localGame.id)
        .maybeSingle();
      onWatchlist = !!wl;
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      {/* Poster */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-card bg-surfaceRaised shadow-lg shadow-black/30">
        {game.cover_url ? (
          <Image src={game.cover_url} alt={`${game.name} cover`} fill className="object-cover" sizes="260px" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted">no cover</div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="font-display text-3xl font-medium tracking-tight">{game.name}</h1>
            {game.rating && (
              <span
                className="rounded border border-accent/30 bg-accent/5 px-2 py-0.5 font-mono text-xs text-accent"
                title="Content rating (ESRB / PEGI)"
              >
                {game.rating}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-sm text-muted">
            {game.first_release_date ? new Date(game.first_release_date).getFullYear() : 'Release date unknown'}
            {game.developer ? ` · ${game.developer}` : ''}
          </p>
          {(game.genres?.length > 0 || game.platforms?.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {game.genres?.map((g: string) => (
                <span key={g} className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-0.5 text-xs text-accent">
                  {g}
                </span>
              ))}
              {game.platforms?.slice(0, 6).map((p: string) => (
                <span key={p} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
                  {p}
                </span>
              ))}
              {(game.platforms?.length ?? 0) > 6 && (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
                  +{(game.platforms?.length ?? 0) - 6} more
                </span>
              )}
            </div>
          )}
          {game.summary && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text/90">{game.summary}</p>}
          {game.youtube && (
            <a
              href={`https://www.youtube.com/watch?v=${game.youtube}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-card border border-border px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent/40 hover:text-text"
            >
              ▶ Watch trailer
            </a>
          )}
          <p className="mt-3 font-mono text-[10px] text-muted/60">
            Game data from{' '}
            <a href="https://thegamesdb.net" target="_blank" rel="noreferrer" className="underline hover:text-accent">
              TheGamesDB
            </a>
          </p>
        </div>

        {user ? (
          <>
            <div className="flex flex-wrap gap-2">
              <WatchlistButton gameId={thegamesdbId} initial={onWatchlist} />
              <AddToListButton gameId={thegamesdbId} />
            </div>
            <LogForm gameId={thegamesdbId} existing={existingLog} />
          </>
        ) : (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-muted">
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>{' '}
            to log this game, review it, and add it to your watchlist.
          </p>
        )}
      </div>

      <section className="space-y-4 lg:col-span-2">
        <h2 className="border-b border-border pb-2 font-display text-lg font-medium">Community reviews</h2>
        <ReviewFeed gameId={thegamesdbId} currentUsername={currentUsername} />
      </section>
    </div>
  );
}
