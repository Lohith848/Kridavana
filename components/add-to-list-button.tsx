'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ListOption = { id: number; name: string };

export default function AddToListButton({ gameId }: { gameId: number }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListOption[]>([]);
  const [added, setAdded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    setAdded(null);
    if (next && lists.length === 0) {
      const res = await fetch('/api/lists');
      const data = await res.json();
      setLists(data.lists ?? []);
    }
  }

  async function addToList(listId: number, name: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/lists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thegamesdb_id: gameId, list_id: listId })
      });
      if (res.ok) {
        setAdded(`Added to "${name}"`);
        setTimeout(() => setOpen(false), 1500);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        onClick={toggle}
        variant="secondary"
        size="sm"
      >
        <ListPlus className="h-4 w-4" />
        <span>Add to list</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute z-30 mt-2 w-64 overflow-hidden rounded-card border border-hairline bg-surfaceRaised shadow-card-hover"
          >
            {added ? (
              <p className="px-4 py-3 text-xs font-medium text-amber">{added}</p>
            ) : lists.length === 0 ? (
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted px-1">No lists yet.</p>
                <Link
                  href="/lists/new"
                  className="block rounded-lg bg-amber/10 px-3 py-2 font-body text-xs font-medium text-amber hover:bg-amber/20 transition-colors"
                >
                  + Create a list
                </Link>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto p-1.5">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => addToList(l.id, l.name)}
                    className="block w-full truncate rounded-lg px-3 py-2 text-left text-xs font-medium text-cream hover:bg-surface transition-colors"
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
