import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Phishing Detection Platform',
  description: 'Analyze URLs and emails for phishing threats using rule-based heuristics, Google Safe Browsing, VirusTotal, and a trained ML model.',
}

const FEATURES = [
  {
    icon: '🔗',
    title: 'URL Scanner',
    description: '4 independent signals: heuristic rules, Safe Browsing, VirusTotal, and ML inference — all combined into one verdict.',
  },
  {
    icon: '📧',
    title: 'Email Scanner',
    description: 'Pattern-only analysis of email content: urgency, credential harvesting, suspicious links — zero API quota consumed.',
  },
  {
    icon: '🤖',
    title: 'ML Model',
    description: 'Logistic regression trained on 235k URLs (PhiUSIIL dataset). 91.06% accuracy, capped at 25 score points to prevent false overrides.',
  },
  {
    icon: '🛡️',
    title: 'Admin Controls',
    description: 'Admin-managed keyword library, scan audit log across all users, and role enforcement verified at DB level on every request.',
  },
]

const STATS = [
  { value: '91%', label: 'ML Accuracy' },
  { value: '235k', label: 'Training URLs' },
  { value: '4', label: 'Signal Sources' },
  { value: '< 3s', label: 'Scan Latency' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 shadow-lg shadow-blue-500/20">
          <span className="text-4xl" aria-hidden="true">🛡️</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight max-w-3xl">
          AI{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Phishing Detection
          </span>{' '}
          Platform
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
          Analyze any URL or email for phishing threats using four independent signals —
          heuristic rules, Google Safe Browsing, VirusTotal, and a trained ML model.
          Results in under 3 seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <Link
            href="/signup"
            id="cta-signup"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 text-center"
          >
            Get Started — Free
          </Link>
          <Link
            href="/login"
            id="cta-login"
            className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 text-center"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm"
            >
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">{value}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-8">
            Everything you need to detect phishing threats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon, title, description }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/8 hover:border-blue-500/30 transition-all duration-200 group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">
                  {icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-6 text-center text-xs text-slate-500">
        AI Phishing Detection Platform · Built with Next.js &amp; Supabase
      </footer>
    </main>
  )
}
