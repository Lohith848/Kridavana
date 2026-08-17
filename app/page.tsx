import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PosterCard from '@/components/poster-card';
import GameCard from '@/components/game-card';
import { ArrowRight, Plus, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MotionDiv, MotionSection } from '@/components/ui/motion';

export const dynamic = 'force-dynamic';

const fadeIn = (delay: number) => ({
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
  }
});

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: playing }, { data: recent }, { data: allLogs }] = await Promise.all([
    supabase
      .from('logs')
      .select('id, platform, rating, games(thegamesdb_id, name, cover_url, first_release_date)')
      .eq('status', 'playing')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('logs')
      .select('id, platform, rating, hours_played, finished_on, games(thegamesdb_id, name, cover_url)')
      .not('finished_on', 'is', null)
      .order('finished_on', { ascending: false })
      .limit(3),
    supabase.from('logs').select('status, rating, hours_played')
  ]);

  const logs = allLogs ?? [];

  const totalHours = logs.reduce((sum, l) => sum + (l.hours_played ?? 0), 0);
  const ratings = logs.filter((l) => l.rating != null).map((l) => Number(l.rating));
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  const completed = logs.filter((l) => l.status === 'completed').length;

  const stats = [
    { 
      label: 'Hours logged', 
      value: totalHours > 0 ? `${Math.round(totalHours * 10) / 10}` : '0',
      icon: Flame,
      color: 'text-amber'
    },
    { 
      label: 'Games completed', 
      value: String(completed),
      icon: ArrowRight,
      color: 'text-teal'
    },
    { 
      label: 'Average rating', 
      value: avgRating ?? '—',
      icon: Star,
      color: 'text-amber'
    }
  ];

  const hasAnyData = logs.length > 0;

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <MotionSection
        initial="hidden"
        animate="visible"
        variants={fadeIn(0)}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-1">
          <h1 className="font-display text-3xl sm:text-[40px] sm:leading-[44px] font-semibold tracking-tight text-cream">
            Welcome back.
          </h1>
          <p className="font-body text-sm text-muted">
            {logs.length
              ? `${logs.length} ${logs.length === 1 ? 'game' : 'games'} logged in your cartridge collection.`
              : 'Your cartridge log awaits your first play session.'}
          </p>
        </div>
        <Link href="/diary">
          <Button variant="primary" size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            <span>Log a game</span>
          </Button>
        </Link>
      </MotionSection>

      {/* Empty state */}
      {!hasAnyData ? (
        <MotionSection
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="rounded-card border border-dashed border-hairline bg-surface/50 p-12 text-center backdrop-blur-sm"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surfaceRaised border border-hairline">
            <Plus className="h-7 w-7 text-muted" />
          </div>
          <h2 className="font-display text-xl font-medium text-cream">Nothing logged yet.</h2>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">
            Search any game from the diary — poster artwork, genres, and platform data come in automatically.
          </p>
          <Link href="/diary" className="mt-6 inline-block">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              <span>Log your first game</span>
            </Button>
          </Link>
        </MotionSection>
      ) : (
        <>
          {/* Stat Cards */}
          <MotionSection
            initial="hidden"
            animate="visible"
            variants={fadeIn(1)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-card border border-hairline bg-surface p-5 transition-all duration-200 hover:border-hairline/80 hover:shadow-card"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surfaceRaised border border-hairline">
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="font-mono text-2xl font-medium text-amber">{stat.value}</p>
                      <p className="mt-0.5 font-body text-xs text-muted">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </MotionSection>

          {/* Currently Playing */}
          {playing && playing.length > 0 && (
            <MotionSection
              initial="hidden"
              animate="visible"
              variants={fadeIn(2)}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber" />
                  <h2 className="font-display text-base font-medium text-cream">Currently playing</h2>
                </div>
                <Link
                  href="/diary?status=playing"
                  className="group inline-flex items-center gap-1 font-body text-xs text-muted hover:text-amber transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {playing.map((log: any, i: number) => (
                  <MotionDiv
                    key={log.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                  >
                    <PosterCard
                      gameId={log.games.thegamesdb_id}
                      name={log.games.name}
                      coverUrl={log.games.cover_url}
                      releaseDate={log.games.first_release_date}
                      rating={log.rating}
                    />
                  </MotionDiv>
                ))}
              </div>
            </MotionSection>
          )}

          {/* Recent diary entries */}
          {recent && recent.length > 0 && (
            <MotionSection
              initial="hidden"
              animate="visible"
              variants={fadeIn(3)}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h2 className="font-display text-base font-medium text-cream">Recent diary entries</h2>
                <Link
                  href="/diary"
                  className="group inline-flex items-center gap-1 font-body text-xs text-muted hover:text-amber transition-colors"
                >
                  <span>View full diary</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((log: any, i: number) => (
                  <MotionDiv
                    key={log.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                  >
                    <GameCard
                      gameId={log.games.thegamesdb_id}
                      name={log.games.name}
                      coverUrl={log.games.cover_url}
                      meta={`${log.platform ? `${log.platform} · ` : ''}${log.hours_played ? `${log.hours_played}h · ` : ''}${log.finished_on ? new Date(log.finished_on).toLocaleDateString('en-US') : ''}`}
                      rating={log.rating}
                    />
                  </MotionDiv>
                ))}
              </div>
            </MotionSection>
          )}
        </>
      )}
    </div>
  );
}
