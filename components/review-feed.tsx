'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

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
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [posting, setPosting] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?thegamesdb_id=${gameId}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike(review: Review) {
    const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    setReviews((rs) =>
      rs.map((r) =>
        r.id === review.id ? { ...r, liked_by_me: data.liked, like_count: data.like_count } : r
      )
    );
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
    const res = await fetch(`/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text })
    });
    setPosting((p) => ({ ...p, [reviewId]: false }));
    if (!res.ok) return;
    const data = await res.json();
    setComments((c) => ({ ...c, [reviewId]: [...(c[reviewId] ?? []), data.comment] }));
    setCommentText((t) => ({ ...t, [reviewId]: '' }));
    setReviews((rs) =>
      rs.map((r) => (r.id === reviewId ? { ...r, comment_count: r.comment_count + 1 } : r))
    );
  }

  if (loading) {
    return <p className="py-4 text-center font-mono text-xs text-muted">Loading community reviews…</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-8 text-center">
        <p className="font-display text-base text-text">No reviews yet</p>
        <p className="mt-1 text-sm text-muted">Write a review on this page and it'll show up here for everyone.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/u/${review.username}`} className="font-mono text-sm text-accent hover:underline">
                {review.username}
              </Link>
              {review.rating != null && (
                <span className="rounded border border-accent/30 bg-accent/5 px-1.5 py-0.5 font-mono text-xs text-accent">
                  ★ {Number(review.rating).toFixed(1)}
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-muted">{timeAgo(review.created_at)}</span>
          </div>

          {review.body && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text/90">{review.body}</p>
          )}

          <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-3">
            {review.username !== currentUsername && (
              <button
                onClick={() => toggleLike(review)}
                className={clsx(
                  'flex items-center gap-1.5 font-mono text-xs transition-colors',
                  review.liked_by_me ? 'text-accent' : 'text-muted hover:text-text'
                )}
                aria-label={review.liked_by_me ? 'Unlike review' : 'Like review'}
              >
                <span className="text-sm leading-none">{review.liked_by_me ? '♥' : '♡'}</span>
                {review.like_count > 0 && review.like_count}
              </button>
            )}
            <button
              onClick={() => toggleComments(review.id)}
              className="flex items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-text"
            >
              <span className="text-sm leading-none">💬</span>
              {review.comment_count > 0 && review.comment_count}
              {openComments.has(review.id) ? 'hide' : 'comments'}
            </button>
          </div>

          {openComments.has(review.id) && (
            <div className="mt-3 space-y-3">
              {(comments[review.id] ?? []).map((c) => (
                <div key={c.id} className="rounded bg-surfaceRaised/60 px-3 py-2">
                  <p className="font-mono text-xs text-accent">
                    {c.username} <span className="text-muted">· {timeAgo(c.created_at)}</span>
                  </p>
                  <p className="mt-1 text-sm text-text/90">{c.body}</p>
                </div>
              ))}
              {currentUsername ? (
                <div className="flex gap-2">
                  <input
                    value={commentText[review.id] ?? ''}
                    onChange={(e) => setCommentText((t) => ({ ...t, [review.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && postComment(review.id)}
                    placeholder="Add a comment…"
                    className="flex-1 rounded border border-border bg-surfaceRaised px-3 py-1.5 text-sm text-text placeholder:text-muted focus:border-accent"
                  />
                  <button
                    onClick={() => postComment(review.id)}
                    disabled={posting[review.id]}
                    className="rounded border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/20 disabled:opacity-60"
                  >
                    Post
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  <Link href="/login" className="text-accent hover:underline">
                    Sign in
                  </Link>{' '}
                  to comment.
                </p>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
