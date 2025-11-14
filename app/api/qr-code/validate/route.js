import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Validate QR code
export async function POST(request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find QR code
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !qrCode) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 404 }
      )
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(qrCode.expires_at)

    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'QR code has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({ qrCode })
  } catch (error) {
    console.error('Error validating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
