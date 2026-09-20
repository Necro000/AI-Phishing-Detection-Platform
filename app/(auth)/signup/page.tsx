import { Suspense } from 'react'
import { AuthCard } from '@/components/AuthCard'

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle radial ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[400px] h-[300px] bg-emerald-600/[0.04] rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-zinc-500 text-xs font-mono">Initializing defense portal...</div>}>
        <AuthCard initialMode="signup" />
      </Suspense>
    </main>
  )
}
