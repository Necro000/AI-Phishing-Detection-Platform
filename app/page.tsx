import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30">
          <span className="text-4xl">🛡️</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          AI Phishing Detection
        </h1>
        <p className="text-lg text-slate-300 mb-8">
          Analyze URLs and emails for phishing threats using rule-based heuristics,
          Google Safe Browsing, VirusTotal, and a trained ML signal.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/signup"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
