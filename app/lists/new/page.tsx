'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className="mx-auto max-w-lg space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-cream">New list</h1>
        <p className="mt-1 font-body text-sm text-muted">
          A ranked list gets numbers — perfect for a Best of the Year. Unranked is just a collection.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-card border border-hairline bg-surface p-6 shadow-card">
        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Games that changed my life"
          />
        </div>

        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional — what is this list about?"
            className="w-full min-h-[80px] resize-y rounded-lg border border-hairline bg-surfaceRaised px-3 py-2 text-sm text-cream placeholder:text-muted transition-all duration-150 outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)]"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 font-body text-sm text-cream group">
          <Checkbox
            checked={isRanked}
            onCheckedChange={(checked) => setIsRanked(checked as boolean)}
          />
          <span className="group-hover:text-cream transition-colors">Ranked list (shows 1, 2, 3…)</span>
        </label>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium text-rose"
          >
            {error}
          </motion.p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            size="sm"
          >
            {saving ? 'Creating…' : 'Create list'}
          </Button>
          <Link href="/lists">
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
