'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfirmed, setNotConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotConfirmed(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
        setNotConfirmed(true);
        return;
      }
      setError(error.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-medium">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to keep your play diary going.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-card border border-border bg-surface p-6">
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
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
        </div>

        {notConfirmed && (
          <div className="rounded border border-accent/30 bg-accent/5 p-3">
            <p className="text-sm text-text">Please verify your email first.</p>
            <p className="mt-1 text-xs text-muted">We sent a verification code to {email}. Enter it to activate your account.</p>
            <Link
              href={`/verify-email?email=${encodeURIComponent(email)}`}
              className="mt-2 inline-block font-mono text-xs text-accent hover:underline"
            >
              Enter verification code →
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        New here?{' '}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
