'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight, Gamepad2 } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';

type Result = {
  thegamesdb_id: number;
  name: string;
  cover_url: string | null;
  first_release_date: string | null;
};

const slideUp = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 }
};

export default function GameSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setIsOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <SearchBar
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => { setQuery(''); setIsOpen(false); }}
        placeholder="Search for a game to log…"
        isLoading={loading}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideUp}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-card border border-hairline bg-surfaceRaised shadow-card-hover"
          >
            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber border-t-transparent" />
                <span className="text-sm text-muted">Searching TheGamesDB…</span>
              </div>
            )}

            {/* No results */}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-hairline">
                  <Gamepad2 className="h-5 w-5 text-muted" />
                </div>
                <p className="text-sm font-medium text-cream">No games found for &ldquo;{query}&rdquo;.</p>
                <p className="mt-1 text-xs text-muted">Check the spelling, or try the English title.</p>
              </div>
            )}

            {/* Results list */}
            {!loading && results.length > 0 && (
              <div className="max-h-80 overflow-y-auto py-1.5">
                {results.map((r, i) => (
                  <motion.div
                    key={r.thegamesdb_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={`/game/${r.thegamesdb_id}`}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface"
                    >
                      <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded-cover border border-hairline bg-surface">
                        {r.cover_url && (
                          <Image src={r.cover_url} alt="" fill className="object-cover" sizes="28px" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-cream">{r.name}</p>
                        {r.first_release_date && (
                          <p className="font-mono text-xs text-muted">{r.first_release_date.slice(0, 4)}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted/50" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
