import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RatingMeter from '@/components/ui/rating-meter';
import { Heart, MessageCircle, Calendar } from 'lucide-react';
import { MotionDiv, MotionHeader, MotionSection } from '@/components/ui/motion';

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
      {/* Profile Header */}
      <MotionHeader
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="flex items-center gap-5"
      >
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-pill border-2 border-amber/40 bg-gradient-to-br from-amber/20 to-amber/5 font-display text-2xl font-semibold text-amber shadow-glow">
            {profile.username?.slice(0, 1).toUpperCase()}
          </div>
          <div className="absolute -inset-1 rounded-pill bg-amber/10 blur-md -z-10" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-cream">
            @{profile.username}
          </h1>
          {profile.bio && <p className="font-body text-sm text-muted">{profile.bio}</p>}
          <div className="flex items-center gap-1.5 text-muted">
            <Calendar className="h-3 w-3" />
            <p className="font-mono text-xs">
              Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </MotionHeader>

      {/* Reviews Section */}
      <MotionSection
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h2 className="font-display text-lg font-medium text-cream">Reviews</h2>
          {reviews && reviews.length > 0 && (
            <span className="font-mono text-xs text-muted">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>

        {(!reviews || reviews.length === 0) ? (
          <div className="rounded-card border border-dashed border-hairline bg-surface/50 p-10 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surfaceRaised border border-hairline">
              <MessageCircle className="h-5 w-5 text-muted" />
            </div>
            <p className="font-display text-base text-cream">No public reviews yet.</p>
            <p className="mt-1 text-sm text-muted">This player hasn&apos;t written any reviews.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any, i: number) => (
              <MotionDiv
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              >
                <Link
                  href={`/game/${r.games.thegamesdb_id}`}
                  className="group flex gap-4 rounded-card border border-hairline bg-surface p-4 transition-all duration-200 hover:border-hairline/80 hover:shadow-card"
                >
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-cover border border-hairline bg-surfaceRaised">
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
                      <p className="truncate font-body text-sm font-medium text-cream group-hover:text-amber transition-colors">
                        {r.games.name}
                      </p>
                      {r.rating != null && (
                        <RatingMeter value={r.rating} readOnly compact />
                      )}
                    </div>
                    {r.body && (
                      <p className="mt-1.5 line-clamp-2 font-body text-xs leading-relaxed text-cream/80">
                        {r.body}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-4 font-mono text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" />
                        {r.review_likes?.[0]?.count ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {r.review_comments?.[0]?.count ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </div>
        )}
      </MotionSection>
    </div>
  );
}
