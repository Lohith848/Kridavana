'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import RatingMeter from '@/components/ui/rating-meter';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type Review = {
  id: number;
  rating: number | null;
  body: string | null;
  created_at: string;
  username: string;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

type Comment = {
  id: number;
  body: string;
  created_at: string;
  username: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReviewFeed({
  gameId,
  currentUsername
}: {
  gameId: number;
  currentUsername: string | null;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [posting, setPosting] = useState<Record<number, boolean>>({});
  const [reviewBody, setReviewBody] = useState('');
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/reviews?thegamesdb_id=${gameId}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {
      setError('Could not load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike(review: Review) {
    try {
      const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      setReviews((rs) =>
        rs.map((r) =>
          r.id === review.id ? { ...r, liked_by_me: data.liked, like_count: data.like_count } : r
        )
      );
    } catch {
      // Network error — silently ignore
    }
  }

  async function toggleComments(reviewId: number) {
    if (openComments.has(reviewId)) {
      setOpenComments((s) => {
        const n = new Set(s);
        n.delete(reviewId);
        return n;
      });
      return;
    }
    setOpenComments((s) => new Set(s).add(reviewId));
    if (!comments[reviewId]) {
      const res = await fetch(`/api/reviews/${reviewId}/comments`);
      const data = await res.json();
      setComments((c) => ({ ...c, [reviewId]: data.comments ?? [] }));
    }
  }

  async function postComment(reviewId: number) {
    const text = commentText[reviewId]?.trim();
    if (!text || posting[reviewId]) return;
    setPosting((p) => ({ ...p, [reviewId]: true }));
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text })
      });
      if (!res.ok) return;
      const data = await res.json();
      setComments((c) => ({ ...c, [reviewId]: [...(c[reviewId] ?? []), data.comment] }));
      setCommentText((t) => ({ ...t, [reviewId]: '' }));
      setReviews((rs) =>
        rs.map((r) => (r.id === reviewId ? { ...r, comment_count: r.comment_count + 1 } : r))
      );
    } catch {
      // Network error — do nothing
    } finally {
      setPosting((p) => ({ ...p, [reviewId]: false }));
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewBody.trim() || !reviewRating || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thegamesdb_id: gameId, body: reviewBody, rating: reviewRating })
      });
      if (!res.ok) return;
      const data = await res.json();
      setReviews((rs) => [data.review, ...rs]);
      setReviewBody('');
      setReviewRating(null);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-card border border-hairline bg-surface p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-surfaceRaised" />
              <div className="h-4 w-32 rounded bg-surfaceRaised" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-surfaceRaised" />
              <div className="h-3 w-3/4 rounded bg-surfaceRaised" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-card border border-dashed border-rose/40 bg-rose/5 p-8 text-center">
        <p className="text-sm text-rose">{error}</p>
        <button
          onClick={load}
          className="mt-3 font-mono text-xs text-amber hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Write review form */}
      {currentUsername ? (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmitReview}
          className="rounded-card border border-hairline bg-surface p-5 shadow-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{currentUsername?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-body text-sm font-medium text-cream">@{currentUsername}</span>
          </div>
          <RatingMeter value={reviewRating} onChange={setReviewRating} />
          <textarea
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            rows={3}
            placeholder="Share your thoughts on this game..."
            className="mt-3 w-full min-h-[80px] resize-y rounded-lg border border-hairline bg-surfaceRaised px-3 py-2.5 text-sm text-cream placeholder:text-muted transition-all duration-150 outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)]"
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="submit"
              disabled={submitting || !reviewBody.trim() || !reviewRating}
              variant="primary"
              size="sm"
            >
              {submitting ? 'Posting…' : 'Post review'}
            </Button>
          </div>
        </motion.form>
      ) : (
        <div className="rounded-card border border-dashed border-hairline bg-surface/50 p-5 text-center backdrop-blur-sm">
          <p className="text-sm text-muted">
            <Link href="/login" className="font-semibold text-amber hover:underline">
              Sign in
            </Link>{' '}
            to write a review.
          </p>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline bg-surface/50 p-8 text-center backdrop-blur-sm">
          <p className="font-display text-base text-cream">No reviews yet</p>
          <p className="mt-1 text-sm text-muted">Write a review on this page and it'll show up here for everyone.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.article
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-card border border-hairline bg-surface p-5 transition-all duration-200 hover:border-hairline/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{review.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Link href={`/u/${review.username}`} className="font-body text-sm font-medium text-cream hover:text-amber transition-colors">
                    {review.username}
                  </Link>
                  {review.rating != null && (
                    <div className="ml-1">
                      <RatingMeter value={review.rating} readOnly compact />
                    </div>
                  )}
                </div>
                <span className="font-mono text-xs text-muted">{timeAgo(review.created_at)}</span>
              </div>

              {review.body && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-cream/90">{review.body}</p>
              )}

              <Separator className="my-3" />

              <div className="flex items-center gap-2">
                {review.username !== currentUsername && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleLike(review)}
                    className={clsx(
                      'flex h-9 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs transition-colors',
                      review.liked_by_me
                        ? 'text-rose hover:bg-rose/10'
                        : 'text-muted hover:bg-surfaceRaised hover:text-cream'
                    )}
                    aria-label={review.liked_by_me ? 'Unlike review' : 'Like review'}
                  >
                    <Heart
                      className={clsx('h-4 w-4 transition-transform', review.liked_by_me ? 'fill-rose text-rose' : 'text-muted')}
                    />
                    {review.like_count > 0 && <span>{review.like_count}</span>}
                  </motion.button>
                )}
                <button
                  onClick={() => toggleComments(review.id)}
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 font-mono text-xs text-muted hover:bg-surfaceRaised hover:text-cream transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-muted" />
                  {review.comment_count > 0 && <span>{review.comment_count}</span>}
                  <span>{openComments.has(review.id) ? 'hide' : 'comments'}</span>
                </button>
              </div>

              <AnimatePresence>
                {openComments.has(review.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-3 overflow-hidden"
                  >
                    {(comments[review.id] ?? []).map((c) => (
                      <div key={c.id} className="rounded-lg bg-surfaceRaised px-4 py-2.5 border border-hairline/60">
                        <p className="font-mono text-xs text-amber">
                          @{c.username} <span className="text-muted">· {timeAgo(c.created_at)}</span>
                        </p>
                        <p className="mt-1 text-sm text-cream/90">{c.body}</p>
                      </div>
                    ))}
                    {currentUsername ? (
                      <div className="flex gap-2 pt-1">
                        <Input
                          value={commentText[review.id] ?? ''}
                          onChange={(e) => setCommentText((t) => ({ ...t, [review.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && postComment(review.id)}
                          placeholder="Add a comment…"
                          className="flex-1"
                        />
                        <Button
                          onClick={() => postComment(review.id)}
                          disabled={posting[review.id] || !(commentText[review.id]?.trim())}
                          variant="primary"
                          size="sm"
                        >
                          Post
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        <Link href="/login" className="text-amber hover:underline">
                          Sign in
                        </Link>{' '}
                        to comment.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
