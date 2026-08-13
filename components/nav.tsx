import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/sign-out-button';

const links = [
  { href: '/', label: 'Home' },
  { href: '/diary', label: 'Diary' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/lists', label: 'Lists' }
];

export default async function Nav() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-medium tracking-tight text-text">
          Krida<span className="text-accent">Vana</span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-text"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-4 border-l border-border pl-5">
              <Link
                href={username ? `/u/${username}` : '/diary'}
                className="font-mono text-xs text-accent hover:underline"
              >
                {username ?? 'profile'}
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-card border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/20"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
