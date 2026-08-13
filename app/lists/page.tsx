import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ListsPage() {
  const supabase = createClient();

  const { data: lists } = await supabase
    .from('lists')
    .select('id, name, description, kind, is_pinned, list_items(count)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const pinned = lists?.filter((l) => l.is_pinned) ?? [];
  const custom = lists?.filter((l) => !l.is_pinned) ?? [];

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium">Lists</h1>
          <p className="mt-1 text-sm text-muted">Rank your favorites, curate anything.</p>
        </div>
        <Link
          href="/lists/new"
          className="rounded-card border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm text-accent hover:bg-accent/20"
        >
          + New list
        </Link>
      </div>

      {pinned.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm uppercase tracking-wide text-muted">Pinned</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-sm uppercase tracking-wide text-muted">Your lists</h2>
        {custom.length === 0 ? (
          <p className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted">
            No lists yet — start with your Best 100 or a themed list of your own.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {custom.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ListCard({ list }: { list: any }) {
  const count = list.list_items?.[0]?.count ?? 0;
  return (
    <Link
      href={`/lists/${list.id}`}
      className="rounded-card border border-border bg-surface p-4 hover:border-accent/40"
    >
      <p className="font-display text-base text-text">{list.name}</p>
      {list.description && <p className="mt-1 text-sm text-muted">{list.description}</p>}
      <p className="mt-2 font-mono text-xs text-muted">{count} game{count === 1 ? '' : 's'}</p>
    </Link>
  );
}
