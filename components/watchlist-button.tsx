'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <motion.div whileTap={{ scale: 0.97 }}>
      <Button
        onClick={toggle}
        disabled={busy}
        variant={onWatchlist ? "primary" : "secondary"}
        size="sm"
      >
        {onWatchlist ? (
          <>
            <BookmarkCheck className="h-4 w-4" />
            <span>On watchlist</span>
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" />
            <span>Add to watchlist</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}
