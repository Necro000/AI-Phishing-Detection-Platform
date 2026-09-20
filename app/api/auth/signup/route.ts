import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabaseServiceClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 1. Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    // 2. Validate password (Edge-Cases.md: enforced client + server side)
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    // 3. Admin service role client creates user directly (Brain.md §1 Rule 5: role never set from client)
    const serviceClient = createServiceClient()

    const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true, // Pre-confirm to prevent email rate limits
    })

    if (createError) {
      const msg = createError.message.toLowerCase()
      if (
        msg.includes('registered') ||
        msg.includes('already exists') ||
        msg.includes('user already')
      ) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    // 4. Ensure profile row exists (handles case where DB trigger isn't applied yet)
    if (userData?.user?.id) {
      try {
        await serviceClient
          .from('profiles')
          .insert({ id: userData.user.id, role: 'user' })
      } catch {
        // Safe to ignore if trigger already created it or table doesn't exist yet
      }
    }

    return NextResponse.json(
      { success: true, userId: userData.user.id },
      { status: 201 }
    )
  } catch (err: unknown) {
    console.error('[api/auth/signup] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error.' },
      { status: 500 }
    )
  }
}
