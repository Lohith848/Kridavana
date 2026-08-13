'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

function friendlyError(err: { message?: string; status?: number }): string {
  const msg = (err.message ?? '').toLowerCase();
  if (msg.includes('expired')) return 'This code has expired. Please request a new code.';
  if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('not match') || msg.includes('token'))
    return 'That code is incorrect. Please try again.';
  if (msg.includes('too many') || msg.includes('rate') || err.status === 429)
    return 'Too many requests. Please wait before requesting another code.';
  if (msg.includes('already') || msg.includes('verified'))
    return 'This account is already verified. You can sign in.';
  return msg || 'Something went wrong. Please try again.';
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((i: number) => {
    const clamped = Math.min(Math.max(i, 0), CODE_LENGTH - 1);
    inputsRef.current[clamped]?.focus();
  }, []);

  // countdown before the next resend is allowed
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    focusInput(0);
  }, [focusInput]);

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
    // handles typing one digit, or a pasted multi-digit chunk
    const chars = clean.split('');
    setDigits((d) => {
      const n = [...d];
      chars.forEach((ch, k) => {
        if (i + k < CODE_LENGTH) n[i + k] = ch;
      });
      return n;
    });
    focusInput(i + chars.length);
    setError(null);
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
    setDigits((d) => {
      const n = [...d];
      text.split('').forEach((ch, k) => {
        n[k] = ch;
      });
      return n;
    });
    focusInput(Math.min(text.length, CODE_LENGTH - 1));
    setError(null);
  }

  async function handleVerify() {
    const token = digits.join('');
    if (token.length < CODE_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setVerifying(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'signup'
    });

    setVerifying(false);

    if (verifyError) {
      setError(friendlyError(verifyError));
      return;
    }

    if (data.session) {
      // verified — session established, continue into the app
      router.push('/');
      router.refresh();
    } else {
      // safety net: no session returned; normal login will work now
      router.push('/login');
      router.refresh();
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }

    setResending(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() });

    setResending(false);

    if (resendError) {
      const msg = (resendError.message ?? '').toLowerCase();
      if (msg.includes('too many') || msg.includes('rate') || resendError.status === 429) {
        setError('Too many requests. Please wait before requesting another code.');
      } else if (msg.includes('already') || msg.includes('confirmed')) {
        setError('This account is already verified. You can sign in.');
      } else {
        setError(resendError.message || 'Could not resend the code.');
      }
      return;
    }

    setCooldown(RESEND_COOLDOWN);
    setInfo('A new code has been sent to your email.');
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-medium">Verify your email</h1>
        <p className="mt-1 text-sm text-muted">
          {initialEmail
            ? `We sent a 6-digit verification code to ${initialEmail}.`
            : 'Enter your email and we\'ll send you a 6-digit verification code.'}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify();
        }}
        className="space-y-5 rounded-card border border-border bg-surface p-6"
      >
        {!initialEmail && (
          <div>
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block font-mono text-xs uppercase tracking-wide text-muted">Verification code</label>
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
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
                aria-label={`Digit ${i + 1}`}
                className="h-14 w-full max-w-[3rem] rounded border border-border bg-surfaceRaised text-center font-mono text-2xl text-text focus:border-accent"
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={verifying || digits.some((d) => d === '')}
          className="w-full rounded-card bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg hover:bg-accent/90 disabled:opacity-60"
        >
          {verifying ? 'Verifying…' : 'Verify email'}
        </button>

        <div className="text-center">
          <p className="text-sm text-muted">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="mt-1 font-mono text-xs text-accent hover:underline disabled:cursor-not-allowed disabled:text-muted"
          >
            {resending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
