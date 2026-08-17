'use client';

import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

interface AuthLayoutProps {
  heading: string;
  subheading: string;
  step?: 1 | 2;
  children: React.ReactNode;
  className?: string;
}

export default function AuthLayout({
  heading,
  subheading,
  step,
  children,
  className,
}: AuthLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className={clsx(
        'mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm flex-col justify-center py-12',
        className
      )}
    >
      {/* Logo mark */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 30 }}
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber/20 to-amber/5 ring-1 ring-amber/30"
        >
          <Gamepad2 className="h-7 w-7 text-amber" />
        </motion.div>

        <p className="font-display text-sm font-medium tracking-tight text-muted">
          Krida<span className="text-amber">Vana</span>
        </p>
      </div>

      {/* Step indicator */}
      {step && (
        <div className="mb-6 flex justify-center gap-2" aria-label={`Step ${step} of 2`}>
          {([1, 2] as const).map((n) => (
            <motion.div
              key={n}
              className="h-1 rounded-full"
              initial={false}
              animate={{
                width: n === step ? 32 : 16,
                backgroundColor: n === step ? '#E8A33D' : '#2A2E3D'
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            />
          ))}
        </div>
      )}

      {/* Heading block */}
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-medium tracking-tight text-cream">
          {heading}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{subheading}</p>
      </div>

      {/* Card content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
