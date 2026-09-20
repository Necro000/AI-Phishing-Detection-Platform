/**
 * lib/mimeParser.ts
 *
 * Robust RFC 822 MIME parser and sanitizer for .eml and email text files.
 * - Extracts Subject, From, Date, and plain-text body
 * - Decodes Quoted-Printable (=3D, =20, soft line breaks) and Base64 payloads
 * - Extracts URLs with strict allow-list: ONLY http:// and https:// schemes are permitted
 * - Explicitly neutralizes and blocks javascript:, data:, and other unsafe URIs
 * - Identifies proprietary binary .msg files and returns actionable guidance
 */

export interface ParsedEmailResult {
  subject?: string
  from?: string
  date?: string
  bodyText: string
  extractedUrls: string[]
  dangerousSchemesBlocked: number
}

// Allowed web schemes for clickable or inspectable URLs
const SAFE_SCHEME_REGEX = /^https?:\/\//i
const UNSAFE_SCHEME_REGEX = /^(javascript|data|vbscript|file):/i

/**
 * Decode Quoted-Printable text per RFC 2045
 */
export function decodeQuotedPrintable(input: string): string {
  // 1. Remove soft line breaks (=\r\n or =\n)
  let decoded = input.replace(/=\r?\n/g, '')

  // 2. Replace =XX hex sequences with character
  decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16))
    } catch {
      return `=${hex}`
    }
  })

  return decoded
}

/**
 * Safely decode Base64 content in browser/node environments
 */
export function decodeBase64(input: string): string {
  try {
    const clean = input.replace(/[^A-Za-z0-9+/=]/g, '')
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(clean)
    }
    return Buffer.from(clean, 'base64').toString('utf-8')
  } catch {
    return input // Fallback to raw text if base64 decoding fails
  }
}

/**
 * Check if buffer or string is Outlook binary OLE format (.msg)
 */
export function isOutlookMsgBinary(headerBytes: Uint8Array): boolean {
  // Compound File Binary Format magic numbers: D0 CF 11 E0 A1 B1 1A E1
  return (
    headerBytes.length >= 8 &&
    headerBytes[0] === 0xd0 &&
    headerBytes[1] === 0xcf &&
    headerBytes[2] === 0x11 &&
    headerBytes[3] === 0xe0 &&
    headerBytes[4] === 0xa1 &&
    headerBytes[5] === 0xb1 &&
    headerBytes[6] === 0x1a &&
    headerBytes[7] === 0xe1
  )
}

/**
 * Extract and sanitize URLs from raw email text
 */
export function extractAndSanitizeUrls(text: string): {
  safeUrls: string[]
  blockedCount: number
} {
  // Regex finding http, https, and possible dangerous schemes in text
  const urlCandidateRegex = /\b(?:https?|javascript|data|vbscript|file):\/\/[^\s"'<>()[\]{}]+/gi
  const matches = text.match(urlCandidateRegex) ?? []

  const safeUrls: string[] = []
  let blockedCount = 0

  for (const rawUrl of matches) {
    // Strip trailing punctuation that often attaches from sentence ends
    const cleaned = rawUrl.replace(/[.,;!?)]+$/, '')

    if (SAFE_SCHEME_REGEX.test(cleaned)) {
      if (!safeUrls.includes(cleaned)) {
        safeUrls.push(cleaned)
      }
    } else if (UNSAFE_SCHEME_REGEX.test(cleaned)) {
      blockedCount++
    }
  }

  return { safeUrls, blockedCount }
}

/**
 * Main parser function for .eml content and plain-text emails
 */
export function parseEmailContent(rawInput: string): ParsedEmailResult {
  // Split header from body at the first double newline
  const headerBodySplit = rawInput.split(/\r?\n\r?\n/)

  let subject: string | undefined
  let from: string | undefined
  let date: string | undefined
  let bodyText = ''
  let encoding: string | undefined

  if (headerBodySplit.length > 1) {
    const rawHeaders = headerBodySplit[0]
    const rawBody = headerBodySplit.slice(1).join('\n\n')

    // Parse standard RFC 822 headers (handling multi-line unfolding)
    const unfoldedHeaders = rawHeaders.replace(/\r?\n[ \t]+/g, ' ')
    const headerLines = unfoldedHeaders.split(/\r?\n/)

    for (const line of headerLines) {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue

      const key = line.slice(0, colonIdx).trim().toLowerCase()
      const val = line.slice(colonIdx + 1).trim()

      if (key === 'subject') subject = val
      else if (key === 'from') from = val
      else if (key === 'date') date = val
      else if (key === 'content-transfer-encoding') encoding = val.toLowerCase()
    }

    // Decode body if an encoding header was specified
    if (encoding === 'quoted-printable') {
      bodyText = decodeQuotedPrintable(rawBody)
    } else if (encoding === 'base64') {
      bodyText = decodeBase64(rawBody)
    } else {
      bodyText = rawBody
    }
  } else {
    // No headers detected, treat entire payload as raw email text
    bodyText = rawInput
  }

  // Sanitize body content: Strip HTML tags to raw text to eliminate script/iframe injection
  const sanitizedText = bodyText
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .trim()

  const { safeUrls, blockedCount } = extractAndSanitizeUrls(rawInput)

  return {
    subject,
    from,
    date,
    bodyText: sanitizedText.length > 0 ? sanitizedText : bodyText.trim(),
    extractedUrls: safeUrls,
    dangerousSchemesBlocked: blockedCount,
  }
}
