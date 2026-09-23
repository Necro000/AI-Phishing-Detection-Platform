'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ToastProvider'

interface AuthCardProps {
  initialMode: 'login' | 'signup'
}

type StrengthLevel = 'WEAK' | 'MODERATE' | 'STRONG'

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

  // Synchronize internal mode with initialMode prop when URL changes externally
  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  function switchMode(newMode: 'login' | 'signup') {
    setMode(newMode)
    const targetUrl = newMode === 'login' ? '/login' : '/signup'
    const fullUrl = rawRedirectTo
      ? `${targetUrl}?redirectTo=${encodeURIComponent(rawRedirectTo)}`
      : targetUrl
    router.replace(fullUrl, { scroll: false })
  }

  // Real-time password strength assessment
  const passwordAnalysis = useMemo(() => {
    const hasMinLen = password.length >= 8
    const hasNumber = /[0-9]/.test(password)
    const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)

    const score = [hasMinLen, hasNumber, hasUpperAndLower, hasSpecial].filter(Boolean).length

    let level: StrengthLevel = 'WEAK'
    let percent = 25
    let color = 'bg-rose-500'
    let textColor = 'text-rose-400'

    if (score >= 3 && hasMinLen) {
      level = 'STRONG'
      percent = 100
      color = 'bg-gradient-to-r from-cyan-400 to-emerald-400'
      textColor = 'text-emerald-400'
    } else if (score >= 2 && password.length >= 6) {
      level = 'MODERATE'
      percent = 65
      color = 'bg-amber-400'
      textColor = 'text-amber-400'
    }

    return {
      score,
      level,
      percent,
      color,
      textColor,
      hasMinLen,
      hasNumber,
      hasSpecial,
    }
  }, [password])

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
    <div className="w-full max-w-[440px] mx-auto select-none relative z-10">
      {/* Floating Cyber-Glass Bento Card */}
      <div className="relative rounded-3xl bg-slate-900/70 border border-cyan-500/25 p-7 sm:p-8 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)] overflow-hidden">
        {/* Top subtle cyan energy highlight */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        
        {/* Radial sheen accent inside card */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* Cyber Emblem Header */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="relative group mb-3">
            {/* Ambient pulse ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-30 blur group-hover:opacity-60 transition duration-500" />
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-inner shadow-cyan-500/20">
              <span className="bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent font-bold font-mono tracking-tighter">
                AI
              </span>
            </div>
            {/* Tiny live status pip */}
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white font-mono">
            {mode === 'login' ? 'THREAT CONSOLE ACCESS' : 'CREATE ANALYST ACCOUNT'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-[320px]">
            {mode === 'login'
              ? 'Authenticate to access multi-engine phishing intelligence'
              : 'Register for AI-powered zero-trust threat verification'}
          </p>
        </div>

        {/* Pill-shaped Cyber Tab Switcher */}
        <div className="relative p-1 mb-6 rounded-full bg-slate-950/80 border border-white/10 flex items-center shadow-inner">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Register</span>
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {/* Work Email Field */}
          <div>
            <label
              htmlFor="auth-email"
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5 font-mono flex items-center justify-between"
            >
              <span>Work Email</span>
              <span className="text-[10px] text-cyan-400/70 font-normal">Encrypted</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </span>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="auth-password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 font-mono"
              >
                Password {mode === 'signup' && <span className="text-slate-500 font-normal lowercase">(min. 8 chars)</span>}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 font-mono"
              >
                {showPassword ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
              />
            </div>

            {/* Dynamic Password Strength Meter (Shown during Registration or when password is typed) */}
            {mode === 'signup' && password.length > 0 && (
              <div className="mt-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={`font-bold tracking-wider ${passwordAnalysis.textColor}`}>
                    {passwordAnalysis.level}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-950/90 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${passwordAnalysis.color}`}
                    style={{ width: `${passwordAnalysis.percent}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                  <span className={passwordAnalysis.hasMinLen ? 'text-emerald-400' : 'text-slate-500'}>
                    {passwordAnalysis.hasMinLen ? '✓' : '•'} 8+ chars
                  </span>
                  <span className={passwordAnalysis.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                    {passwordAnalysis.hasNumber ? '✓' : '•'} Number
                  </span>
                  <span className={passwordAnalysis.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}>
                    {passwordAnalysis.hasSpecial ? '✓' : '•'} Special
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Signup mode only) */}
          {mode === 'signup' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label
                htmlFor="auth-confirm-password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5 font-mono"
              >
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs tracking-wide uppercase font-mono transition-all duration-200 shadow-lg shadow-cyan-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{mode === 'login' ? 'Authenticating Session…' : 'Initializing Profile…'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Authenticate Session →' : 'Create Analyst Account →'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>TLS 1.3 Encrypted • Zero-Trust Gateway</span>
          </div>
        </div>
      </div>
    </div>
  )
}
