import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GameCard from '@/components/game-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { List, Plus } from 'lucide-react';
import { MotionDiv } from '@/components/ui/motion';
import Link from 'next/link';

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
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-cream">{list.name}</h1>
          {list.description && <p className="mt-1 font-body text-sm text-muted max-w-xl">{list.description}</p>}
        </div>
      </MotionDiv>

      {(!items || items.length === 0) ? (
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EmptyState
            icon={List}
            title="This list is empty."
            description={`Add games to "${list.name}" from any game detail page.`}
            action={
              <Link href="/diary">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" />
                  <span>Browse games</span>
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
              transition: { staggerChildren: 0.05 }
            }
          }}
          className="space-y-2.5"
        >
          {items.map((item: any, i: number) => (
            <MotionDiv
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }
              }}
              className="flex items-center gap-3 sm:gap-4"
            >
              {list.is_ranked && (
                <span className="w-7 sm:w-8 shrink-0 text-right font-mono text-sm font-medium text-amber">
                  {item.rank ?? i + 1}
                </span>
              )}
              <div className="flex-1">
                <GameCard gameId={item.games.thegamesdb_id} name={item.games.name} coverUrl={item.games.cover_url} />
              </div>
            </MotionDiv>
          ))}
        </MotionDiv>
      )}
    </div>
  );
}
