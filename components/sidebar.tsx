'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Home, List, LogIn, LogOut, Plus, User, Watch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/diary', label: 'Diary', icon: BookOpen },
  { href: '/watchlist', label: 'Watchlist', icon: Watch },
  { href: '/lists', label: 'Lists', icon: List },
]

interface SidebarProps {
  username?: string | null
  isAuthenticated?: boolean
}

function Sidebar({ username, isAuthenticated }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pb-6 pt-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber/10 ring-1 ring-amber/30">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="4" y="9" width="20" height="12" rx="6" fill="#E8A33D" opacity="0.15" />
            <rect x="4" y="9" width="20" height="12" rx="6" stroke="#E8A33D" strokeWidth="1.5" />
            <circle cx="9" cy="15" r="2" fill="#E8A33D" />
            <rect x="17" y="13" width="1.5" height="4" rx="0.75" fill="#E8A33D" />
            <rect x="15.25" y="14.75" width="5" height="1.5" rx="0.75" fill="#E8A33D" />
          </svg>
        </div>
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-cream">
          Krida<span className="text-amber">Vana</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-amber/10 text-amber shadow-inner"
                  : "text-muted hover:bg-surfaceRaised hover:text-cream"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-amber" : "")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-3 border-t border-hairline px-3 pt-4">
        {isAuthenticated ? (
          <>
            <Link
              href={`/u/${username}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surfaceRaised hover:text-cream"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-mono text-xs">@{username}</span>
            </Link>
            <SignOutLink />
          </>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm" className="w-full">
              <LogIn className="h-4 w-4" />
              <span>Sign in</span>
            </Button>
          </Link>
        )}
      </div>
    </aside>
  )
}

function SignOutLink() {
  return (
    <Link href="/api/auth/signout" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surfaceRaised hover:text-rose">
      <LogOut className="h-4 w-4" />
      <span>Sign out</span>
    </Link>
  )
}

export { Sidebar, type SidebarProps }
