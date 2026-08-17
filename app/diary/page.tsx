import { createClient } from '@/lib/supabase/server';
import GameSearch from '@/components/game-search';
import RatingMeter from '@/components/ui/rating-meter';
import Image from 'next/image';
import Link from 'next/link';
import { MotionDiv } from '@/components/ui/motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'wishlist', label: 'Wishlist' }
];

const STATUS_DOT: Record<string, string> = {
  playing: 'bg-teal',
  completed: 'bg-amber',
  dropped: 'bg-rose',
  on_hold: 'bg-muted',
  backlog: 'bg-muted',
  wishlist: 'bg-muted'
};

const STATUS_LABEL: Record<string, string> = {
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
  on_hold: 'On hold',
  backlog: 'Backlog',
  wishlist: 'Wishlist'
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const as [number, number, number, number] } }
};

export default async function DiaryPage({
  searchParams
}: {
  searchParams: { status?: string };
}) {
  const activeStatus = searchParams.status || 'all';
  const supabase = createClient();

  let query = supabase
    .from('logs')
    .select('id, status, platform, rating, review, hours_played, finished_on, created_at, games(thegamesdb_id, name, cover_url)')
    .order('created_at', { ascending: false });

  if (activeStatus !== 'all') {
    query = query.eq('status', activeStatus);
  }

  const { data: logs } = await query;

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
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-cream">Diary</h1>
          <p className="mt-1 font-body text-sm text-muted">Every game you&apos;ve logged, newest first.</p>
        </div>
        <Link href="/diary">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            <span>Log a game</span>
          </Button>
        </Link>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <GameSearch />
      </MotionDiv>

      {/* Status Filter Pills */}
      <MotionDiv
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {STATUS_FILTERS.map((s, i) => {
          const isSelected = activeStatus === s.value;
          return (
            <MotionDiv
              key={s.value}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.03 }}
            >
              <Link
                href={s.value === 'all' ? '/diary' : `/diary?status=${s.value}`}
                className={`inline-flex items-center rounded-pill border px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'border-amber bg-amber/10 text-amber shadow-[0_0_0_1px_rgba(232,163,61,0.2)]'
                    : 'border-hairline bg-surface text-muted hover:border-cream/30 hover:text-cream'
                }`}
              >
                {s.label}
              </Link>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      {(!logs || logs.length === 0) && (
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-card border border-dashed border-hairline bg-surface/50 p-10 text-center backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surfaceRaised border border-hairline">
            <Plus className="h-5 w-5 text-muted" />
          </div>
          <p className="font-display text-base text-cream">Nothing logged yet.</p>
          <p className="mt-1 text-sm text-muted">
            {activeStatus === 'all'
              ? 'Search above to log your first game.'
              : `No games marked as "${STATUS_LABEL[activeStatus] ?? activeStatus}".`}
          </p>
        </MotionDiv>
      )}

      {/* Monthly Ledger */}
      <div className="space-y-10">
        {Array.from(groups.entries()).map(([month, entries], groupIndex) => (
          <MotionDiv
            key={month}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + groupIndex * 0.1, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6"
          >
            <div className="sprocket-rail w-full sm:w-28 shrink-0 pt-1 font-mono text-xs uppercase tracking-wide text-muted">
              {month}
            </div>
            <MotionDiv
              variants={container}
              initial="hidden"
              animate="show"
              className="flex-1 space-y-3 sm:border-l sm:border-hairline sm:pl-6"
            >
              {entries!.map((log: any) => {
                const dotColor = STATUS_DOT[log.status] ?? 'bg-muted';
                const label = STATUS_LABEL[log.status] ?? log.status;
                return (
                  <MotionDiv key={log.id} variants={item}>
                    <Link
                      href={`/game/${log.games.thegamesdb_id}`}
                      className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-3.5 transition-all duration-200 hover:border-hairline/80 hover:shadow-card"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-cover border border-hairline bg-surfaceRaised">
                          {log.games.cover_url ? (
                            <Image src={log.games.cover_url} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="flex h-full items-center justify-center font-mono text-[9px] text-muted">
                              no cover
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-sm font-medium text-cream">{log.games.name}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 font-body text-xs text-muted">
                              <span className={`inline-block h-1.5 w-1.5 rounded-pill ${dotColor}`} />
                              {label}
                            </span>
                            {log.platform && (
                              <span className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
                                {log.platform}
                              </span>
                            )}
                            {log.hours_played && (
                              <span className="font-mono text-xs text-muted">
                                {log.hours_played}h
                              </span>
                            )}
                          </div>
                        </div>

                        {log.rating != null && (
                          <div className="shrink-0">
                            <RatingMeter value={log.rating} readOnly compact />
                          </div>
                        )}
                      </div>

                      {log.review && (
                        <p className="line-clamp-2 border-t border-hairline/60 pt-2.5 font-body text-xs leading-relaxed text-cream/80">
                          {log.review}
                        </p>
                      )}
                    </Link>
                  </MotionDiv>
                );
              })}
            </MotionDiv>
          </MotionDiv>
        ))}
      </div>
    </div>
  );
}
