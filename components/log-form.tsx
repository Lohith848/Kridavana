'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import RatingMeter from '@/components/ui/rating-meter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STATUSES = [
  { value: 'backlog', label: 'Backlog', dot: 'bg-muted' },
  { value: 'wishlist', label: 'Wishlist', dot: 'bg-muted' },
  { value: 'playing', label: 'Playing', dot: 'bg-teal' },
  { value: 'completed', label: 'Completed', dot: 'bg-amber' },
  { value: 'on_hold', label: 'On hold', dot: 'bg-muted' },
  { value: 'dropped', label: 'Dropped', dot: 'bg-rose' }
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
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      onSubmit={handleSubmit}
      className="space-y-6 rounded-card border border-hairline bg-surface p-6 shadow-card"
    >
      {/* Status */}
      <div>
        <label className="mb-3 block font-mono text-xs uppercase tracking-wider text-muted">Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const isSelected = status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`
                  inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-all duration-200
                  ${isSelected
                    ? 'border-amber bg-amber/10 text-amber shadow-[0_0_0_1px_rgba(232,163,61,0.2)]'
                    : 'border-hairline bg-surfaceRaised/40 text-muted hover:border-cream/30 hover:text-cream'
                  }
                `}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-pill ${s.dot}`} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Platform</label>
          <Input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. PS5, PC, Switch"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Hours played</label>
          <Input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Started</label>
          <Input
            type="date"
            value={startedOn}
            onChange={(e) => setStartedOn(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Finished</label>
          <Input
            type="date"
            value={finishedOn}
            onChange={(e) => setFinishedOn(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-3 block font-mono text-xs uppercase tracking-wider text-muted">Rating</label>
        <RatingMeter value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Review</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
          placeholder="What did you think?"
          className="w-full min-h-[96px] resize-y rounded-lg border border-hairline bg-surfaceRaised px-3 py-2.5 text-sm text-cream placeholder:text-muted transition-all duration-150 outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)]"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-lg border border-rose/30 bg-rose/10 px-4 py-3"
          >
            <p className="text-xs font-medium text-rose">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={saving}
          variant="primary"
          size="sm"
          className="shadow-glow"
        >
          {saving ? 'Saving…' : existing ? 'Update entry' : 'Save to diary'}
        </Button>
        {existing && (
          <Button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            variant="ghost"
            size="sm"
            className="text-rose hover:text-rose hover:bg-rose/10"
          >
            Delete entry
          </Button>
        )}
      </div>
    </motion.form>
  );
}
