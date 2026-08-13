import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import GameCard from '@/components/game-card';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: playing }, { data: recent }, { data: allLogs }] = await Promise.all([
    supabase
      .from('logs')
      .select('id, platform, rating, games(thegamesdb_id, name, cover_url)')
      .eq('status', 'playing')
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('id, platform, rating, finished_on, games(thegamesdb_id, name, cover_url)')
      .not('finished_on', 'is', null)
      .order('finished_on', { ascending: false })
      .limit(5),
    supabase.from('logs').select('status, platform, rating, hours_played')
  ]);

  const logs = allLogs ?? [];

  const totalHours = logs.reduce((sum, l) => sum + (l.hours_played ?? 0), 0);
  const ratings = logs.filter((l) => l.rating != null).map((l) => Number(l.rating));
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  const completed = logs.filter((l) => l.status === 'completed').length;
  const playingCount = logs.filter((l) => l.status === 'playing').length;

  const platformCounts = new Map<string, number>();
  for (const l of logs) {
    if (l.platform) platformCounts.set(l.platform, (platformCounts.get(l.platform) ?? 0) + 1);
  }
  const topPlatform = [...platformCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const stats = [
    { label: 'Hours logged', value: totalHours > 0 ? `${Math.round(totalHours * 10) / 10}` : '0' },
    { label: 'Avg rating', value: avgRating ?? '—' },
    { label: 'Completed', value: String(completed) },
    { label: 'Playing now', value: String(playingCount) },
    { label: 'Top platform', value: topPlatform ?? '—' }
  ];

  const hasAnyData = (playing?.length ?? 0) > 0 || (recent?.length ?? 0) > 0;

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Your <span className="text-accent">play diary</span>
        </h1>
        <p className="mt-2 text-muted">
          {logs.length
            ? `${logs.length} entr${logs.length === 1 ? 'y' : 'ies'} logged so far.`
            : 'Start by searching for a game you\'re playing.'}
        </p>
        <Link
          href="/diary"
          className="mt-4 inline-block rounded-card border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm text-accent hover:bg-accent/20"
        >
          + Log a game
        </Link>
      </section>

      {logs.length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-card border border-border bg-surface p-4">
              <p className="font-mono text-2xl font-medium text-text">{s.value}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-muted">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      {!hasAnyData && (
        <section className="rounded-card border border-dashed border-border p-8 text-center">
          <p className="font-display text-lg text-text">Nothing logged yet</p>
          <p className="mt-1 text-sm text-muted">
            Search any game from the diary page — poster, genres, and platform data come in automatically.
          </p>
        </section>
      )}

      {playing && playing.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm uppercase tracking-wide text-muted">Currently playing</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {playing.map((log: any) => (
              <GameCard
                key={log.id}
                gameId={log.games.thegamesdb_id}
                name={log.games.name}
                coverUrl={log.games.cover_url}
                meta={log.platform ?? undefined}
              />
            ))}
          </div>
        </section>
      )}

      {recent && recent.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm uppercase tracking-wide text-muted">Recently finished</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((log: any) => (
              <GameCard
                key={log.id}
                gameId={log.games.thegamesdb_id}
                name={log.games.name}
                coverUrl={log.games.cover_url}
                meta={log.finished_on}
                rating={log.rating}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
