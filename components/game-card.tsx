import Image from 'next/image';
import Link from 'next/link';

export type GameCardProps = {
  gameId: number;
  name: string;
  coverUrl: string | null;
  meta?: string; // e.g. "PS5 · 34.5h · Completed"
  rating?: number | null;
};

export default function GameCard({ gameId, name, coverUrl, meta, rating }: GameCardProps) {
  return (
    <Link
      href={`/game/${gameId}`}
      className="group flex gap-4 rounded-card border border-border bg-surface p-3 transition-colors hover:border-accent/50"
    >
      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-surfaceRaised">
        {coverUrl ? (
          <Image src={coverUrl} alt={`${name} cover`} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-muted">
            no cover
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="truncate font-display text-base font-medium text-text group-hover:text-accent">
          {name}
        </h3>
        {meta && <p className="mt-1 font-mono text-xs text-muted">{meta}</p>}
        {rating != null && (
          <p className="mt-1 font-mono text-xs text-accent">{rating.toFixed(1)}/10</p>
        )}
      </div>
    </Link>
  );
}
