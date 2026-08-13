'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewListPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRanked, setIsRanked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, is_ranked: isRanked })
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    const data = await res.json();
    router.push(`/lists/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">New list</h1>
        <p className="mt-1 text-sm text-muted">
          A ranked list gets numbers — perfect for a Best of the Year. Unranked is just a collection.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-card border border-border bg-surface p-6">
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Games that changed my life"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional — what is this list about?"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            checked={isRanked}
            onChange={(e) => setIsRanked(e.target.checked)}
            className="h-4 w-4 accent-[#E8A33D]"
          />
          Ranked list (shows 1, 2, 3…)
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-card bg-accent px-5 py-2 font-mono text-sm font-medium text-bg hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create list'}
          </button>
          <Link href="/lists" className="font-mono text-sm text-muted hover:text-text">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
