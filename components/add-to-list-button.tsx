'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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
        setAdded(`Added to “${name}”`);
        setTimeout(() => setOpen(false), 1200);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="rounded-card border border-border px-4 py-2 font-mono text-sm text-muted transition-colors hover:border-accent/40 hover:text-text"
      >
        + Add to list
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-64 rounded-card border border-border bg-surface p-2 shadow-xl">
          {added ? (
            <p className="px-2 py-2 text-sm text-accent">{added}</p>
          ) : lists.length === 0 ? (
            <div className="space-y-2 p-2">
              <p className="text-sm text-muted">No lists yet.</p>
              <Link
                href="/lists/new"
                className="block rounded bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/20"
              >
                + Create a list
              </Link>
            </div>
          ) : (
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => addToList(l.id, l.name)}
                  className="block w-full truncate rounded px-3 py-1.5 text-left text-sm text-text hover:bg-surfaceRaised"
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
