import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PosterCardProps = {
  gameId: number;
  name: string;
  coverUrl: string | null;
  releaseDate?: string | null;
  rating?: number | null;
  onFavorite?: () => void;
  isFavorite?: boolean;
};

export default function PosterCard({
  gameId,
  name,
  coverUrl,
  releaseDate,
  rating,
  onFavorite,
  isFavorite
}: PosterCardProps) {
  const year = releaseDate ? releaseDate.slice(0, 4) : null;

  return (
    <Link
      href={`/game/${gameId}`}
      className="group flex flex-col gap-2"
    >
      <motion.div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-cover border border-hairline bg-surfaceRaised transition-all duration-300 ease-out group-hover:border-amber/40 group-hover:shadow-card"
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${name} cover`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
            no cover
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Favorite button */}
        {onFavorite && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.preventDefault();
              onFavorite();
            }}
            className={cn(
              "absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200",
              isFavorite
                ? "bg-rose/20 text-rose"
                : "bg-ink/40 text-white/70 opacity-0 group-hover:opacity-100 hover:text-rose"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
          </motion.button>
        )}

        {/* Rating badge */}
        {rating != null && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-ink/80 px-1.5 py-0.5 font-mono text-xs font-medium text-amber backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber text-amber" />
            {rating.toFixed(1)}
          </div>
        )}
      </motion.div>

      <div className="px-0.5">
        <h3 className="truncate font-body text-sm font-medium text-cream transition-colors duration-150 group-hover:text-amber">
          {name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          {year && (
            <span className="font-mono text-xs text-muted">
              {year}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
