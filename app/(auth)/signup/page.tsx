import { Suspense } from 'react'
import { AuthCard } from '@/components/AuthCard'

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Cyber Grid & Glow Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      {/* Dynamic Ambient Spotlights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-cyan-500/[0.10] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/4 w-[500px] h-[350px] bg-blue-600/[0.08] rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Concentric Cyber Rings (Matching Option 2 Mockup) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-cyan-500/[0.08] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full border border-blue-500/[0.04] pointer-events-none" />

      <Suspense fallback={<div className="text-cyan-400 text-xs font-mono animate-pulse">Initializing registration portal...</div>}>
        <AuthCard initialMode="signup" />
      </Suspense>
    </main>
  )
}
