'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOtp, validateEmail } from '@/lib/auth/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface EmailStepProps {
  onSuccess: (email: string) => void;
  onToast: (message: string, variant: 'success' | 'error') => void;
}

export default function EmailStep({ onSuccess, onToast }: EmailStepProps) {
  const emailId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (sending) return;
    setSending(true);
    setError(null);

    const result = await sendOtp(email);
    setSending(false);

    if (!result.success) {
      setError(result.error ?? 'Failed to send code.');
      return;
    }

    onToast(`Code sent to ${email.trim()}`, 'success');
    onSuccess(email.trim());
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-card border border-hairline bg-surface p-6 shadow-card"
    >
      <div>
        <label
          htmlFor={emailId}
          className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted"
        >
          Email address
        </label>
        <div className="relative">
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={handleChange}
            placeholder="you@example.com"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={!!error}
            disabled={sending}
            className={clsx(
              error && 'border-rose/80'
            )}
          />
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              id={errorId}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              role="alert"
              className="mt-2 text-xs font-medium text-rose"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p className="font-body text-xs leading-relaxed text-muted">
        We&apos;ll send a 6-digit code to this address. No password needed.
      </p>

      <Button
        type="submit"
        disabled={sending || !email.trim()}
        variant="primary"
        size="lg"
        className="w-full"
      >
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-4 w-4 border-2 border-ink border-t-transparent rounded-full"
            />
            <span>Sending code…</span>
          </span>
        ) : (
          'Continue →'
        )}
      </Button>
    </motion.form>
  );
}
