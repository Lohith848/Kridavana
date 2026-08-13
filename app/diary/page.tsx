import { createClient } from '@/lib/supabase/server';
import GameSearch from '@/components/game-search';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  playing: { label: 'Playing', color: 'bg-playing' },
  completed: { label: 'Completed', color: 'bg-emerald-400' },
  dropped: { label: 'Dropped', color: 'bg-dropped' },
  on_hold: { label: 'On hold', color: 'bg-amber-300' },
  backlog: { label: 'Backlog', color: 'bg-slate-400' },
  wishlist: { label: 'Wishlist', color: 'bg-sky-400' }
};

export default async function DiaryPage() {
  const supabase = createClient();

  const { data: logs } = await supabase
    .from('logs')
    .select('id, status, platform, rating, hours_played, finished_on, created_at, games(thegamesdb_id, name, cover_url)')
    .order('created_at', { ascending: false });

  // group by month for the ledger's date rail
  const groups = new Map<string, typeof logs>();
  for (const log of logs ?? []) {
    const d = new Date((log as any).finished_on ?? (log as any).created_at);
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(log as any);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-medium">Diary</h1>
        <p className="mt-1 text-sm text-muted">Every game you've logged, newest first.</p>
      </div>

      <GameSearch />

      {(!logs || logs.length === 0) && (
        <p className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted">
          No entries yet — search above to log your first game.
        </p>
      )}

      <div className="space-y-10">
        {Array.from(groups.entries()).map(([month, entries]) => (
          <div key={month} className="flex gap-6">
            <div className="sprocket-rail w-28 flex-shrink-0 pt-1 font-mono text-xs uppercase tracking-wide text-muted">
              {month}
            </div>
            <div className="flex-1 space-y-3 border-l border-border pl-6">
              {entries!.map((log: any) => {
                const status = STATUS_META[log.status] ?? STATUS_META.backlog;
                return (
                  <Link
                    key={log.id}
                    href={`/game/${log.games.thegamesdb_id}`}
                    className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm text-text">{log.games.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.color}`} />
                        {status.label}
                        {log.platform ? ` · ${log.platform}` : ''}
                        {log.hours_played ? ` · ${log.hours_played}h` : ''}
                      </p>
                    </div>
                    {log.rating != null && (
                      <span className="flex-shrink-0 font-mono text-sm text-accent">{Number(log.rating).toFixed(1)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
