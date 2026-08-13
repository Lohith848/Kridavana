'use client';

import { useState } from 'react';
import clsx from 'clsx';

export default function WatchlistButton({ gameId, initial }: { gameId: number; initial: boolean }) {
  const [onWatchlist, setOnWatchlist] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thegamesdb_id: gameId })
      });
      if (res.ok) {
        const data = await res.json();
        setOnWatchlist(data.on_watchlist);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={clsx(
        'rounded-card border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-60',
        onWatchlist
          ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
          : 'border-border text-muted hover:border-accent/40 hover:text-text'
      )}
    >
      {onWatchlist ? '★ On watchlist' : '☆ Add to watchlist'}
    </button>
  );
}
