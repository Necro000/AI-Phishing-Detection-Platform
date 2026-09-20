'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ToastProvider'

interface AuthCardProps {
  initialMode: 'login' | 'signup'
}

export function AuthCard({ initialMode }: AuthCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const rawRedirectTo = searchParams.get('redirectTo')
  const infoMessage = searchParams.get('message')

  // Sanitize redirect target (Open redirect guard & exclude /admin for new signups)
  const safeRedirectTo =
    rawRedirectTo &&
    rawRedirectTo.startsWith('/') &&
    !rawRedirectTo.startsWith('//') &&
    !rawRedirectTo.includes('\\') &&
    (mode === 'login' || !rawRedirectTo.startsWith('/admin'))
      ? rawRedirectTo
      : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Surface any URL messages (e.g. redirected from signup or signout) as top-right toast
  useEffect(() => {
    if (infoMessage) {
      toast.info('Account Notice', infoMessage)
    }
  }, [infoMessage, toast])

  function switchMode(newMode: 'login' | 'signup') {
    setMode(newMode)
    const targetUrl = newMode === 'login' ? '/login' : '/signup'
    const fullUrl = rawRedirectTo
      ? `${targetUrl}?redirectTo=${encodeURIComponent(rawRedirectTo)}`
      : targetUrl
    router.replace(fullUrl)
  }

  async function handleLogin(cleanEmail: string) {
    const supabase = createBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (signInError) {
      setLoading(false)
      const msg = signInError.message.toLowerCase()
      if (
        msg.includes('invalid login credentials') ||
        msg.includes('invalid username or password')
      ) {
        toast.error('Authentication Failed', 'Incorrect email or password. Please verify your credentials.')
      } else if (msg.includes('email not confirmed')) {
        toast.warning('Email Unverified', 'Please check your inbox to confirm your email before signing in.')
      } else if (signInError.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
        toast.error('Rate Limit Active', 'Too many attempts. Please wait a moment before trying again.')
      } else {
        toast.error('Sign In Failed', signInError.message)
      }
      return
    }

    toast.success('Access Granted', 'Redirecting to your threat intelligence dashboard…')
    window.location.assign(safeRedirectTo)
  }

  async function handleSignup(cleanEmail: string) {
    if (password.length < 8) {
      setLoading(false)
      toast.warning('Weak Password', 'Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setLoading(false)
      toast.error('Password Mismatch', 'Passwords do not match. Please re-enter your password.')
      return
    }

    // Call server-side signup endpoint (bypasses Supabase SMTP rate-limits)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    })

    const result = await res.json()

    if (!res.ok) {
      setLoading(false)
      toast.error('Registration Failed', result.error || 'Failed to create account. Please try again.')
      return
    }

    toast.success('Account Created', 'Signing into your defense console…')

    // Auto-authenticate session
    try {
      const supabase = createBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (!signInError) {
        window.location.assign(safeRedirectTo)
        return
      }
    } catch {
      // Fallback
    }

    router.push(
      `/login?message=${encodeURIComponent(
        'Account created successfully! Please sign in with your credentials.'
      )}`
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      toast.warning('Validation Error', 'Please enter your email address.')
      return
    }

    if (!password) {
      toast.warning('Validation Error', 'Please enter your password.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        await handleLogin(cleanEmail)
      } else {
        await handleSignup(cleanEmail)
      }
    } catch (err: unknown) {
      setLoading(false)
      toast.error('Connection Error', err instanceof Error ? err.message : 'Unable to connect to security server.')
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-auto select-none">
      {/* Minimalist Bento Glass Card */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Subtle top rim light */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent" />

        {/* Minimal Shield Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl mb-3 shadow-sm">
            🛡️
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white uppercase font-mono">
            AI Phishing Defense
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login'
              ? 'Enter your credentials to access the console'
              : 'Create an analyst account to start scanning'}
          </p>
        </div>

        {/* Minimalist Tab Switcher (Linear Style) */}
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 pb-3 text-xs font-medium tracking-wide transition-all cursor-pointer relative ${
              mode === 'login'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
            {mode === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 pb-3 text-xs font-medium tracking-wide transition-all cursor-pointer relative ${
              mode === 'signup'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Create Account
            {mode === 'signup' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auth-password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400"
              >
                Password {mode === 'signup' && <span className="text-zinc-500 font-normal lowercase">(min. 8 chars)</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="animate-in fade-in duration-200">
              <label
                htmlFor="auth-confirm-password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl text-xs transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-zinc-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{mode === 'login' ? 'Authenticating…' : 'Creating profile…'}</span>
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>
        </form>

        {/* Security Tagline */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <p className="text-[10px] font-mono text-zinc-500">
            🔒 256-Bit TLS • Row-Level DB Security • ML Threat Model
          </p>
        </div>
      </div>
    </div>
  )
}
