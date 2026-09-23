import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Phishing Detection Platform',
  description:
    'Enterprise AI platform to detect phishing URLs and hostile emails using rule-based heuristics, Google Safe Browsing, VirusTotal, and trained ML models.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>

      <body
        className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-500/30 selection:text-blue-200`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
