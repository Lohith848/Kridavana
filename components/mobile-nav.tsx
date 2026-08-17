'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BookOpen, Watch, List, LogIn, User, LogOut } from 'lucide-react';
import SignOutButton from '@/components/sign-out-button';
import { Button } from '@/components/ui/button';

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
}

const links: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist', icon: Watch },
  { href: '/lists', label: 'Lists', icon: List },
];

interface MobileNavProps {
  username: string | null;
  isAuthenticated: boolean;
}

export default function MobileNav({ username, isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surfaceRaised hover:text-cream transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs border-l border-hairline bg-surface shadow-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                  <Link href="/" className="font-display text-base font-semibold tracking-tight text-cream">
                    Krida<span className="text-amber">Vana</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surfaceRaised hover:text-cream transition-colors"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-6 flex flex-col gap-1 px-4">
                  {links.map((l) => {
                    const Icon = l.icon
                    const isActive = pathname === l.href
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-amber/10 text-amber'
                            : 'text-muted hover:bg-surfaceRaised hover:text-cream'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{l.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto border-t border-hairline p-4">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <Link
                        href={username ? `/u/${username}` : '/diary'}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surfaceRaised hover:text-cream"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/10 font-display text-xs font-bold text-amber">
                          {username?.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-mono text-xs">@{username ?? 'profile'}</span>
                      </Link>
                      <div onClick={() => setOpen(false)}>
                        <SignOutButton />
                      </div>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="primary" size="sm" className="w-full">
                        <LogIn className="h-4 w-4" />
                        <span>Sign in</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
