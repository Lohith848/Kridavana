import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GameCardProps = {
  gameId: number;
  name: string;
  coverUrl: string | null;
  meta?: string;
  rating?: number | null;
};

export default function GameCard({ gameId, name, coverUrl, meta, rating }: GameCardProps) {
  return (
    <Link
      href={`/game/${gameId}`}
      className="group flex gap-4 rounded-card border border-hairline bg-surface p-3 transition-all duration-200 ease-out hover:border-amber/40 hover:shadow-card"
    >
      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-cover border border-hairline bg-surfaceRaised">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${name} cover`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] text-muted">
            no cover
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-1">
        <h3 className="truncate font-body text-sm font-medium text-cream transition-colors duration-150 group-hover:text-amber">
          {name}
        </h3>
        {meta && <p className="font-mono text-xs text-muted truncate">{meta}</p>}
        {rating != null && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber text-amber" />
            <span className="font-mono text-xs font-medium text-amber">{rating.toFixed(1)}/10</span>
          </div>
        )}
      </div>
    </Link>
  );
}
