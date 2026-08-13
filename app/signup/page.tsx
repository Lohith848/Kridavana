'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    setLoading(false);

    if (error) {
      const msg = (error.message ?? '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(error.message);
      }
      return;
    }

    if (data.session) {
      // email confirmation is disabled — straight in
      router.push('/');
      router.refresh();
    } else {
      // account created — email verification (OTP) is required
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-medium">Join Kridavana</h1>
        <p className="mt-1 text-sm text-muted">Log, rate, and review every game you play.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-card border border-border bg-surface p-6">
        <div>
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-muted">Username</label>
          <input
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
            placeholder="yourgamertag"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
          <p className="mt-1 font-mono text-[11px] text-muted">Public name shown on your reviews & profile.</p>
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded border border-border bg-surfaceRaised px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-card bg-accent px-5 py-2.5 font-mono text-sm font-medium text-bg hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
