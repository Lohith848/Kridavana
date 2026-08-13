'use client';

import { useState } from 'react';
import clsx from 'clsx';

const TICKS = Array.from({ length: 21 }, (_, i) => i * 0.5); // 0, 0.5, ... 10

export default function RatingMeter({
  value,
  onChange,
  readOnly = false
}: {
  value: number | null;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-6 items-end gap-[3px]"
        onMouseLeave={() => setHover(null)}
        role={readOnly ? undefined : 'slider'}
        aria-label="Rating out of 10"
        aria-valuenow={value ?? 0}
        aria-valuemin={0}
        aria-valuemax={10}
      >
        {TICKS.map((t) => {
          const filled = t <= display;
          const isMajor = t % 1 === 0;
          return (
            <button
              key={t}
              type="button"
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(t)}
              onClick={() => !readOnly && onChange?.(t)}
              className={clsx(
                'w-[3px] rounded-full transition-colors',
                isMajor ? 'h-6' : 'h-4',
                filled ? 'bg-accent' : 'bg-border',
                !readOnly && 'cursor-pointer hover:bg-accent/70'
              )}
              aria-hidden="true"
              tabIndex={-1}
            />
          );
        })}
      </div>
      <span className="font-mono text-sm text-muted">
        {value != null ? value.toFixed(1) : '—'}<span className="text-border">/10</span>
      </span>
    </div>
  );
}
