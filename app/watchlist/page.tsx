import { createClient } from '@/lib/supabase/server';
import GameCard from '@/components/game-card';
import GameSearch from '@/components/game-search';

export const dynamic = 'force-dynamic';

export default async function WatchlistPage() {
  const supabase = createClient();

  const { data: items } = await supabase
    .from('watchlist')
    .select('id, note, added_at, games(thegamesdb_id, name, cover_url)')
    .order('added_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-medium">Watchlist</h1>
        <p className="mt-1 text-sm text-muted">Games you want to play — not yet in your backlog.</p>
      </div>

      <GameSearch />

      {(!items || items.length === 0) ? (
        <p className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted">
          Nothing on your watchlist yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item: any) => (
            <GameCard
              key={item.id}
              gameId={item.games.thegamesdb_id}
              name={item.games.name}
              coverUrl={item.games.cover_url}
              meta={item.note ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
