import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GameCard from '@/components/game-card';

export const dynamic = 'force-dynamic';

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: list } = await supabase.from('lists').select('*').eq('id', params.id).single();
  if (!list) notFound();

  const { data: items } = await supabase
    .from('list_items')
    .select('id, rank, games(thegamesdb_id, name, cover_url)')
    .eq('list_id', params.id)
    .order('rank', { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">{list.name}</h1>
        {list.description && <p className="mt-1 text-sm text-muted">{list.description}</p>}
      </div>

      {(!items || items.length === 0) ? (
        <p className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted">
          This list is empty — add games from any game page.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item: any, i) => (
            <div key={item.id} className="flex items-center gap-4">
              {list.is_ranked && (
                <span className="w-8 flex-shrink-0 text-right font-mono text-sm text-muted">
                  {item.rank ?? i + 1}
                </span>
              )}
              <div className="flex-1">
                <GameCard gameId={item.games.thegamesdb_id} name={item.games.name} coverUrl={item.games.cover_url} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
