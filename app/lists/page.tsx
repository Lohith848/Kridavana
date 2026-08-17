import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MotionDiv, MotionSection } from '@/components/ui/motion';

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
      <MotionDiv
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-cream">Lists</h1>
          <p className="mt-1 font-body text-sm text-muted">Rank your favorites, curate anything.</p>
        </div>
        <Link href="/lists/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            <span>New list</span>
          </Button>
        </Link>
      </MotionDiv>

      {pinned.length > 0 && (
        <MotionSection
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-3.5 w-3.5 text-amber" />
            <h2 className="font-display text-xs uppercase tracking-wider text-muted">Pinned</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((l) => (
              <MotionDiv
                key={l.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                }}
              >
                <ListCard list={l} />
              </MotionDiv>
            ))}
          </div>
        </MotionSection>
      )}

      <MotionSection
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h2 className="font-display text-xs uppercase tracking-wider text-muted mb-4">Your lists</h2>
        {custom.length === 0 ? (
          <EmptyState
            title="No lists yet."
            description="Start with your Best 100 or a themed list of your own."
            action={
              <Link href="/lists/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" />
                  <span>Create a list</span>
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {custom.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
        )}
      </MotionSection>
    </div>
  );
}

function ListCard({ list }: { list: any }) {
  const count = list.list_items?.[0]?.count ?? 0;
  return (
    <Link
      href={`/lists/${list.id}`}
      className="group flex flex-col justify-between rounded-card border border-hairline bg-surface p-5 transition-all duration-200 hover:border-amber/40 hover:shadow-card"
    >
      <div>
        <p className="font-display text-base font-medium text-cream group-hover:text-amber transition-colors">{list.name}</p>
        {list.description && <p className="mt-1.5 font-body text-sm text-muted line-clamp-2">{list.description}</p>}
      </div>
      <p className="mt-3 font-mono text-xs font-medium text-amber">
        {count} {count === 1 ? 'game' : 'games'}
      </p>
    </Link>
  );
}
