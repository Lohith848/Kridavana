'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Result = {
  thegamesdb_id: number;
  name: string;
  cover_url: string | null;
  first_release_date: string | null;
};

export default function GameSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 350); // debounce so we don't hammer TheGamesDB on every keystroke

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a game to log…"
        className="w-full rounded-card border border-border bg-surface px-4 py-3 font-body text-text placeholder:text-muted focus:border-accent"
      />
      {loading && <p className="mt-2 font-mono text-xs text-muted">Searching…</p>}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2 rounded-card border border-dashed border-border px-4 py-3 font-mono text-xs text-muted">
          No games found — try a different name.
        </p>
      )}
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full space-y-1 rounded-card border border-border bg-surface p-2 shadow-xl">
          {results.map((r) => (
            <Link
              key={r.thegamesdb_id}
              href={`/game/${r.thegamesdb_id}`}
              className="flex items-center gap-3 rounded p-2 hover:bg-surfaceRaised"
            >
              <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded bg-surfaceRaised">
                {r.cover_url && (
                  <Image src={r.cover_url} alt="" fill className="object-cover" sizes="28px" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-text">{r.name}</p>
                {r.first_release_date && (
                  <p className="font-mono text-xs text-muted">{r.first_release_date.slice(0, 4)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
