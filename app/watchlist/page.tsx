import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PosterCard from '@/components/poster-card';
import GameSearch from '@/components/game-search';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Eye } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';

export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const supabase = createClient();

  const { data: items } = await supabase
    .from('watchlist')
    .select('id, note, added_at, games(thegamesdb_id, name, cover_url, first_release_date)')
    .order('added_at', { ascending: false });

  return (
    <div className="space-y-8">
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex flex-col gap-1"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-cream">Watchlist</h1>
        <p className="font-body text-sm text-muted">Games you want to play — not yet in your backlog.</p>
      </MotionDiv>

      <MotionDiv
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <GameSearch />
      </MotionDiv>

      {(!items || items.length === 0) ? (
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EmptyState
            icon={Eye}
            title="Nothing on your watchlist."
            description="Search games above and add them to your shelf for future play sessions."
            action={
              <Link href="/diary">
                <Button variant="primary" size="sm">
                  Browse games
                </Button>
              </Link>
            }
          />
        </MotionDiv>
      ) : (
        <MotionDiv
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {items.map((item: any, i: number) => (
            <MotionDiv
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }
              }}
            >
              <PosterCard
                gameId={item.games.thegamesdb_id}
                name={item.games.name}
                coverUrl={item.games.cover_url}
                releaseDate={item.games.first_release_date}
              />
            </MotionDiv>
          ))}
        </MotionDiv>
      )}
    </div>
  );
}
