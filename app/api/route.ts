import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      service: 'PhishGuard AI Phishing Detection Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        url_scanner: {
          path: '/api/scan/url',
          methods: ['GET', 'POST'],
          description: 'Submit an HTTP POST request with { "url": "https://example.com" } to scan URLs for phishing, brand impersonation, and malware.',
        },
        email_scanner: {
          path: '/api/scan/email',
          methods: ['GET', 'POST'],
          description: 'Submit an HTTP POST request with { "content": "email text..." } to detect social engineering and credential harvesting.',
        },
        stats: {
          path: '/api/stats',
          methods: ['GET'],
          description: 'Platform metrics and telemetry counters.',
        },
      },
    },
    { status: 200 }
  )
}
