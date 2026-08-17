'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyOtp, resendOtp } from '@/lib/auth/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

interface OtpStepProps {
  email: string;
  onSuccess: (isNewUser: boolean) => void;
  onToast: (message: string, variant: 'success' | 'error') => void;
  onBack: () => void;
}

export default function OtpStep({ email, onSuccess, onToast, onBack }: OtpStepProps) {
  const errorId = useId();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(i, CODE_LENGTH - 1));
    inputsRef.current[clamped]?.focus();
  }, []);

  useEffect(() => {
    focusInput(0);
  }, [focusInput]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const autoSubmitRef = useRef(false);

  useEffect(() => {
    const full = digits.every((d) => d !== '');
    if (full && !verifying && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      doVerify(digits.join(''));
    }
    if (!full) autoSubmitRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  function handleDigitChange(i: number, raw: string) {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => {
        const n = [...d];
        n[i] = '';
        return n;
      });
      return;
    }
    const chars = clean.split('');
    setDigits((d) => {
      const n = [...d];
      chars.forEach((ch, k) => {
        if (i + k < CODE_LENGTH) n[i + k] = ch;
      });
      return n;
    });
    focusInput(i + chars.length);
    if (error) setError(null);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setDigits((d) => {
        const n = [...d];
        n[i] = '';
        return n;
      });
      if (digits[i] === '' && i > 0) focusInput(i - 1);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focusInput(i - 1);
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      focusInput(i + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!text) return;
    setDigits(() => {
      const n = Array(CODE_LENGTH).fill('');
      text.split('').forEach((ch, k) => {
        n[k] = ch;
      });
      return n;
    });
    focusInput(Math.min(text.length, CODE_LENGTH - 1));
    if (error) setError(null);
  }

  async function doVerify(token: string) {
    setVerifying(true);
    setError(null);

    const result = await verifyOtp(email, token);
    setVerifying(false);

    if (!result.success) {
      setError(result.error ?? 'Verification failed.');
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => focusInput(0), 50);
      return;
    }

    onToast(
      result.isNewUser ? 'Account created! Welcome to KridaVana 🎮' : 'Welcome back!',
      'success'
    );
    onSuccess(!!result.isNewUser);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = digits.join('');
    if (token.length < CODE_LENGTH) {
      setError('Enter all 6 digits of your code.');
      return;
    }
    await doVerify(token);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);

    const result = await resendOtp(email);
    setResending(false);

    if (!result.success) {
      onToast(result.error ?? 'Could not resend code.', 'error');
      return;
    }

    setCooldown(RESEND_COOLDOWN);
    setDigits(Array(CODE_LENGTH).fill(''));
    focusInput(0);
    onToast('New code sent!', 'success');
  }

  const isFull = digits.every((d) => d !== '');

  return (
    <div className="space-y-5">
      {/* Email pill */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between rounded-lg border border-hairline bg-surfaceRaised px-4 py-2.5"
      >
        <span className="font-mono text-xs text-muted">Code sent to</span>
        <span className="font-mono text-xs text-cream truncate max-w-[14rem]">{email}</span>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        onSubmit={handleFormSubmit}
        noValidate
        className="space-y-5 rounded-card border border-hairline bg-surface p-6 shadow-card"
      >
        <fieldset>
          <legend className="mb-4 font-mono text-xs uppercase tracking-wider text-muted">
            Verification code
          </legend>
          <div
            className="flex justify-between gap-2"
            onPaste={handlePaste}
            aria-describedby={error ? errorId : undefined}
          >
            {digits.map((digit, i) => (
              <motion.div
                key={i}
                animate={{
                  borderColor: digit ? 'rgba(232, 163, 61, 0.5)' : 'rgba(42, 46, 61, 1)',
                  backgroundColor: digit ? 'rgba(232, 163, 61, 0.05)' : 'rgba(31, 35, 48, 1)'
                }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                <input
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
                  disabled={verifying}
                  className={clsx(
                    'h-14 w-full rounded-lg border bg-surfaceRaised text-center font-mono text-2xl font-medium text-cream transition-all duration-200',
                    'focus:outline-none focus:border-amber focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)]',
                    verifying && 'opacity-60 cursor-not-allowed'
                  )}
                />
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                id={errorId}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                role="alert"
                className="mt-3 text-xs font-medium text-rose"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </fieldset>

        <Button
          type="submit"
          disabled={verifying || !isFull}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {verifying ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-4 w-4 border-2 border-ink border-t-transparent rounded-full"
              />
              <span>Verifying…</span>
            </span>
          ) : (
            'Verify code →'
          )}
        </Button>

        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-xs text-muted">
            {cooldown > 0 ? `Resend available in ${cooldown}s` : "Didn't receive it?"}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className={clsx(
              'font-mono text-xs transition-colors duration-150',
              cooldown > 0 || resending
                ? 'cursor-not-allowed text-muted/40'
                : 'text-amber hover:underline'
            )}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </div>
      </motion.form>

      <div className="text-center">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onBack}
          className="font-mono text-xs text-muted hover:text-cream transition-colors duration-150"
        >
          ← Use a different email
        </motion.button>
      </div>
    </div>
  );
}
