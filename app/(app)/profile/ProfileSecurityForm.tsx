'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabaseClient'
import { useToast } from '@/components/ToastProvider'

interface Props {
  userEmail: string
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000 // 5 minutes lockout

export function ProfileSecurityForm({ userEmail }: Props) {
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)

  // Rate-limiting / brute-force defense
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [remainingLockoutSecs, setRemainingLockoutSecs] = useState(0)

  // Pure countdown effect
  useEffect(() => {
    if (!lockoutUntil) return

    const interval = setInterval(() => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (diff <= 0) {
        setLockoutUntil(null)
        setRemainingLockoutSecs(0)
      } else {
        setRemainingLockoutSecs(diff)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lockoutUntil])

  const isLockedOut = remainingLockoutSecs > 0

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (isLockedOut) {
      toast.error(
        'Security Rate Limit Active',
        `Too many failed re-authentication attempts. Please wait ${remainingLockoutSecs} seconds before trying again.`
      )
      return
    }

    if (!currentPassword) {
      toast.warning('Input Required', 'Please enter your current password to verify your identity.')
      return
    }

    if (newPassword.length < 8) {
      toast.warning('Weak Password', 'New password must be at least 8 characters long.')
      return
    }

    if (newPassword === currentPassword) {
      toast.warning('Invalid Password', 'New password must be different from your current password.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password Mismatch', 'New password and confirmation do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createBrowserClient()

      // ── Step 1: Pre-flight re-authentication gate ─────────────────────────
      // Proves knowledge of the current secret before allowing password modification
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })

      if (reAuthError) {
        setLoading(false)
        const nextAttempts = failedAttempts + 1
        setFailedAttempts(nextAttempts)

        if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_DURATION_MS
          setLockoutUntil(until)
          setRemainingLockoutSecs(Math.ceil(LOCKOUT_DURATION_MS / 1000))
          toast.threat(
            'Excessive Failed Attempts',
            'Password update locked for 5 minutes due to multiple failed re-authentication attempts.'
          )
        } else {
          toast.error(
            'Re-Authentication Rejected',
            `Current password is incorrect. (${MAX_FAILED_ATTEMPTS - nextAttempts} attempt(s) remaining).`
          )
        }
        return
      }

      // ── Step 2: Apply password update ─────────────────────────────────────
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      setLoading(false)

      if (updateError) {
        toast.error('Update Failed', updateError.message)
        return
      }

      // Success
      setFailedAttempts(0)
      setLockoutUntil(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      toast.success(
        'Credentials Updated',
        'Your password has been changed successfully. Your session remains secure.'
      )
    } catch (err) {
      setLoading(false)
      toast.error(
        'Unexpected Error',
        err instanceof Error ? err.message : 'Unable to complete security update.'
      )
    }
  }

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>🔑 Authentication & Credentials</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Update your master password with verified identity re-authentication.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPasswords(!showPasswords)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          {showPasswords ? 'Hide all passwords' : 'Show passwords'}
        </button>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-5">
        {/* Current Password */}
        <div>
          <label
            htmlFor="current-password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
          >
            Current Password <span className="text-cyan-400">* (Identity Confirmation)</span>
          </label>
          <input
            id="current-password"
            type={showPasswords ? 'text' : 'password'}
            autoComplete="current-password"
            required
            disabled={isLockedOut || loading}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner disabled:opacity-50"
            placeholder="Verify current password"
          />
        </div>

        {/* New Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              New Password <span className="text-slate-500 font-normal lowercase">(min. 8 chars)</span>
            </label>
            <input
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isLockedOut || loading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isLockedOut || loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Security Policy Reminder */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-slate-300 flex items-start gap-2.5">
          <span className="text-blue-400 text-base leading-none">🛡️</span>
          <p className="leading-relaxed">
            Re-authentication verifies you are the authorized session holder. Password updates are encrypted via
            bcrypt and logged in the security audit stream.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || isLockedOut}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-950/50 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Verifying & Updating…</span>
            </>
          ) : isLockedOut ? (
            `Locked (${remainingLockoutSecs}s)`
          ) : (
            'Verify & Update Password'
          )}
        </button>
      </form>
    </div>
  )
}
