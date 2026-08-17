import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/sign-out-button';
import MobileNav from '@/components/mobile-nav';

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
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/10 ring-1 ring-amber/30 transition-all duration-200 group-hover:shadow-glow">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="4" y="9" width="20" height="12" rx="6" fill="#E8A33D" opacity="0.15" />
              <rect x="4" y="9" width="20" height="12" rx="6" stroke="#E8A33D" strokeWidth="1.5" />
              <circle cx="9" cy="15" r="2" fill="#E8A33D" />
              <rect x="17" y="13" width="1.5" height="4" rx="0.75" fill="#E8A33D" />
              <rect x="15.25" y="14.75" width="5" height="1.5" rx="0.75" fill="#E8A33D" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-cream">
            Krida<span className="text-amber transition-all duration-200 group-hover:opacity-80">Vana</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex sm:items-center sm:gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-cream"
            >
              {l.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-amber opacity-0 transition-opacity duration-200 group-hover:opacity-60" />
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3 border-l border-hairline pl-4 ml-1">
              <Link
                href={username ? `/u/${username}` : '/diary'}
                className="flex items-center gap-2 font-mono text-xs text-amber transition-colors hover:text-amber/80"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber/10 text-[10px] font-bold">
                  {username?.slice(0, 1).toUpperCase()}
                </span>
                <span>@{username ?? 'profile'}</span>
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-amber px-4 py-1.5 font-body text-xs font-semibold text-ink transition-all hover:bg-amber/90 hover:shadow-glow"
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Mobile Navigation Drawer */}
        <MobileNav username={username} isAuthenticated={!!user} />
      </div>
    </header>
  );
}
