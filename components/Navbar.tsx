'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabaseClient'

interface NavbarProps {
  userEmail?: string
  role?: string
}

export function Navbar({ userEmail, role = 'user' }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
    } catch {
      // Continue navigation even if supabase call throws
    }
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' },
    {
      label: 'URL Scanner',
      href: '/scan/url',
      active: pathname.startsWith('/scan/url'),
    },
    {
      label: 'Email Scanner',
      href: '/scan/email',
      active: pathname.startsWith('/scan/email'),
    },
  ]

  const isAdmin = role === 'admin'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-lg group-hover:scale-105 group-hover:border-blue-400 transition-all shadow-md shadow-blue-500/10">
              🛡️
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
                AI Defense
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80 leading-tight">
                Threat Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  link.active
                    ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin/scans"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/admin')
                    ? 'bg-purple-600/25 text-purple-300 border border-purple-500/40'
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                }`}
              >
                <span>⚙️</span>
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Engine Status pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ML & Heuristics Active</span>
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-label="User Profile Menu"
              className="flex items-center gap-2.5 p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden lg:block text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {userEmail || 'Account'}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl shadow-2xl py-2 text-xs z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-white/10 mb-1">
                  <p className="text-slate-400 text-[10px] uppercase font-mono">Signed in as</p>
                  <p className="font-semibold text-white truncate mt-0.5">{userEmail || 'User'}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-500/30 bg-blue-500/10 text-blue-300">
                    Role: {role.toUpperCase()}
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>👤</span>
                  <span>Security & Profile</span>
                </Link>

                <Link
                  href="/scan/url"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>🔗</span>
                  <span>Scan URL</span>
                </Link>

                <Link
                  href="/scan/email"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>📧</span>
                  <span>Scan Email File</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin/scans"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-colors"
                  >
                    <span>🛡️</span>
                    <span>Admin Audit Panel</span>
                  </Link>
                )}

                <div className="border-t border-white/10 my-1 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
