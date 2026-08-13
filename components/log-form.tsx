'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RatingMeter from '@/components/ui/rating-meter';

const STATUSES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'dropped', label: 'Dropped' }
];

type ExistingLog = {
  id: number;
  status: string;
  platform: string | null;
  rating: number | null;
  review: string | null;
  hours_played: number | null;
  started_on: string | null;
  finished_on: string | null;
};

export default function LogForm({ gameId, existing }: { gameId: number; existing: ExistingLog | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(existing?.status ?? 'backlog');
  const [platform, setPlatform] = useState(existing?.platform ?? '');
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [review, setReview] = useState(existing?.review ?? '');
  const [hours, setHours] = useState(existing?.hours_played?.toString() ?? '');
  const [startedOn, setStartedOn] = useState(existing?.started_on ?? '');
  const [finishedOn, setFinishedOn] = useState(existing?.finished_on ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thegamesdb_id: gameId,
        log_id: existing?.id,
        status,
        platform,
        rating,
        review,
        hours_played: hours ? Number(hours) : null,
        started_on: startedOn || null,
        finished_on: finishedOn || null
      })
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    router.push('/diary');
    router.refresh();
  }

  async function handleDelete() {
    if (!existing) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/logs?id=${existing.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Could not delete.');
      setSaving(false);
      return;
    }
    router.push('/diary');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-card border border-border bg-surface p-5">
      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                status === s.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Platform</label>
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. PS5, PC, Switch"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Hours played</label>
          <input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Started</label>
          <input
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Finished</label>
          <input
            type="date"
            value={finishedOn}
            onChange={(e) => setFinishedOn(e.target.value)}
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Rating</label>
        <RatingMeter value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Review</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="What did you think?"
          className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-card bg-accent px-5 py-2 font-mono text-sm font-medium text-bg hover:bg-accent/90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : existing ? 'Update entry' : 'Save to diary'}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-card border border-dropped/40 px-4 py-2 font-mono text-sm text-dropped hover:bg-dropped/10 disabled:opacity-60"
          >
            Delete entry
          </button>
        )}
      </div>
    </form>
  );
}
