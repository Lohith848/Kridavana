'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface AuthToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export default function AuthToast({ toast, onDismiss }: AuthToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);

    if (toast.variant === 'success') {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 150);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          role="alert"
          aria-live="assertive"
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-card border bg-surfaceRaised p-4 pr-10 shadow-card-hover',
            toast.variant === 'success'
              ? 'border-l-[3px] border-l-teal'
              : 'border-l-[3px] border-l-rose'
          )}
        >
          {toast.variant === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose" />
          )}

          <p className="flex-1 text-sm text-cream leading-snug">{toast.message}</p>

          <button
            type="button"
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="ml-1 shrink-0 text-muted hover:text-cream transition-colors p-1"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

let _id = 0;

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(message: string, variant: ToastVariant = 'error') {
    setToast({ id: ++_id, message, variant });
  }

  function dismissToast() {
    setToast(null);
  }

  return { toast, showToast, dismissToast };
}
