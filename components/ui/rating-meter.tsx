'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const TICKS = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

export default function RatingMeter({
  value,
  onChange,
  readOnly = false,
  compact = false
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={clsx(
          'flex items-end',
          compact ? 'h-4 gap-[2px]' : 'h-6 gap-[3px]'
        )}
        onMouseLeave={() => setHover(null)}
        role={readOnly ? undefined : 'slider'}
        aria-label="Rating out of 10"
        aria-valuenow={value ?? 0}
        aria-valuemin={0}
        aria-valuemax={10}
      >
        {TICKS.map((t, idx) => {
          const filled = t <= display;
          const isMajor = t % 1 === 0;
          return (
            <motion.button
              key={t}
              type="button"
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(t)}
              onClick={() => !readOnly && onChange?.(t)}
              initial={{ scaleY: 0.2, opacity: 0.3 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: filled && !readOnly && value !== null ? idx * 8 : 0, duration: 100 }}
              className={clsx(
                'rounded-pill transition-colors',
                compact ? (isMajor ? 'h-4 w-[2px]' : 'h-2.5 w-[2px]') : (isMajor ? 'h-6 w-[3px]' : 'h-4 w-[3px]'),
                filled ? 'bg-amber' : 'bg-hairline',
                !readOnly && 'cursor-pointer hover:bg-amber/80'
              )}
              aria-hidden="true"
              tabIndex={-1}
            />
          );
        })}
      </div>
      <span className={clsx('font-mono font-medium text-amber', compact ? 'text-xs' : 'text-sm')}>
        {value != null ? Number(value).toFixed(1) : '—'}
        <span className="text-muted/60 font-normal">/10</span>
      </span>
    </div>
  );
}
