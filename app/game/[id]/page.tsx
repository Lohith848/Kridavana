import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGameById } from '@/lib/thegamesdb';
import LogForm from '@/components/log-form';
import WatchlistButton from '@/components/watchlist-button';
import AddToListButton from '@/components/add-to-list-button';
import ReviewFeed from '@/components/review-feed';
import { Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MotionDiv, MotionSection } from '@/components/ui/motion';

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

const fadeIn = (delay: number) => ({
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
  }
});

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

  if (user && game.id) {
    const [profileResult, logResult, watchlistResult] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
      supabase.from('logs').select('*').eq('user_id', user.id).eq('game_id', game.id).maybeSingle(),
      supabase.from('watchlist').select('id').eq('user_id', user.id).eq('game_id', game.id).maybeSingle()
    ]);

    currentUsername = profileResult.data?.username ?? null;
    existingLog = logResult.data;
    onWatchlist = !!watchlistResult.data;
  }

  const releaseYear = game.first_release_date ? new Date(game.first_release_date).getFullYear() : null;

  return (
    <div className="grid gap-8 lg:gap-12 lg:grid-cols-[280px_1fr]">
      {/* Poster */}
      <MotionDiv
        initial="hidden"
        animate="visible"
        variants={fadeIn(0)}
        className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-card border border-hairline bg-surfaceRaised shadow-card transition-all duration-300 hover:shadow-card-hover"
      >
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={`${game.name} cover`}
            fill
            className="object-cover"
            sizes="280px"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted">no cover</div>
        )}
      </MotionDiv>

      <div className="space-y-6">
        <MotionDiv
          initial="hidden"
          animate="visible"
          variants={fadeIn(1)}
          className="space-y-4"
        >
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-display text-2xl sm:text-[28px] sm:leading-[34px] font-semibold tracking-tight text-cream">
                {game.name}
              </h1>
              {game.rating && (
                <span
                  className="rounded-btn border border-amber/30 bg-amber/5 px-2.5 py-0.5 font-mono text-xs text-amber"
                  title="Content rating (ESRB / PEGI)"
                >
                  {game.rating}
                </span>
              )}
            </div>
            <p className="mt-1.5 font-mono text-xs text-muted">
              {releaseYear || 'Release date unknown'}
              {game.developer ? ` · ${game.developer}` : ''}
            </p>
          </div>

          {(game.genres?.length > 0 || game.platforms?.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {game.genres?.map((g: string) => (
                <Badge key={g} variant="default">{g}</Badge>
              ))}
              {game.platforms?.slice(0, 6).map((p: string) => (
                <Badge key={p} variant="outline">{p}</Badge>
              ))}
              {(game.platforms?.length ?? 0) > 6 && (
                <Badge variant="subtle">+{(game.platforms?.length ?? 0) - 6} more</Badge>
              )}
            </div>
          )}

          {game.summary && (
            <p className="max-w-2xl font-body text-sm leading-relaxed text-cream/90">{game.summary}</p>
          )}

          {game.youtube && (
            <a
              href={`https://www.youtube.com/watch?v=${game.youtube}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-4 py-2 font-body text-xs text-muted transition-all duration-200 hover:border-amber/40 hover:text-cream"
            >
              <Play className="h-3.5 w-3.5 text-amber" />
              <span>Watch trailer</span>
              <ExternalLink className="h-3 w-3 text-muted/50" />
            </a>
          )}

          <p className="font-mono text-[10px] text-muted/60">
            Game data from{' '}
            <a href="https://thegamesdb.net" target="_blank" rel="noreferrer" className="underline hover:text-amber transition-colors">
              TheGamesDB
            </a>
          </p>
        </MotionDiv>

        <Separator />

        {user ? (
          <MotionDiv
            initial="hidden"
            animate="visible"
            variants={fadeIn(2)}
            className="space-y-5"
          >
            <div className="flex flex-wrap gap-2">
              <WatchlistButton gameId={thegamesdbId} initial={onWatchlist} />
              <AddToListButton gameId={thegamesdbId} />
            </div>
            <LogForm gameId={thegamesdbId} existing={existingLog} />
          </MotionDiv>
        ) : (
          <MotionDiv
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-card border border-dashed border-hairline bg-surface/50 p-6 text-center backdrop-blur-sm"
          >
            <p className="text-sm text-muted">
              <Link href="/login" className="font-semibold text-amber hover:underline transition-colors">
                Sign in
              </Link>{' '}
              to log this game, review it, and add it to your watchlist.
            </p>
          </MotionDiv>
        )}
      </div>

      <MotionSection
        initial="hidden"
        animate="visible"
        variants={fadeIn(3)}
        className="space-y-4 lg:col-span-2 pt-4 border-t border-hairline"
      >
        <h2 className="font-display text-lg font-medium text-cream">Community reviews</h2>
        <ReviewFeed gameId={thegamesdbId} currentUsername={currentUsername} />
      </MotionSection>
    </div>
  );
}
