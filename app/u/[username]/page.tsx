import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, bio, created_at')
    .eq('username', params.username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, games(thegamesdb_id, name, cover_url), review_likes(count), review_comments(count)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10 font-display text-2xl text-accent">
          {profile.username?.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-medium">{profile.username}</h1>
          {profile.bio && <p className="mt-0.5 text-sm text-muted">{profile.bio}</p>}
          <p className="mt-1 font-mono text-xs text-muted">
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-3 border-b border-border pb-2 font-display text-lg font-medium">Reviews</h2>
        {(!reviews || reviews.length === 0) ? (
          <p className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted">
            No public reviews yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <Link
                key={r.id}
                href={`/game/${r.games.thegamesdb_id}`}
                className="flex gap-4 rounded-card border border-border bg-surface p-3 transition-colors hover:border-accent/40"
              >
                <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded bg-surfaceRaised">
                  {r.games.cover_url ? (
                    <Image src={r.games.cover_url} alt="" fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-[10px] text-muted">
                      no cover
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-display text-sm text-text">{r.games.name}</p>
                    {r.rating != null && (
                      <span className="flex-shrink-0 font-mono text-sm text-accent">
                        {Number(r.rating).toFixed(1)}
                        <span className="text-muted">/10</span>
                      </span>
                    )}
                  </div>
                  {r.body && <p className="mt-1 line-clamp-2 text-sm text-text/80">{r.body}</p>}
                  <p className="mt-1 font-mono text-xs text-muted">
                    {r.review_likes?.[0]?.count ?? 0} likes · {r.review_comments?.[0]?.count ?? 0} comments
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
