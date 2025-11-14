import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// Generate new QR code
export async function POST(request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { departmentId, expiryMinutes = 5 } = await request.json()

    // Deactivate old QR codes
    await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .eq('department_id', departmentId)
      .eq('is_active', true)

    // Generate new QR code
    const qrId = uuidv4()
    const code = `${qrId}-${departmentId}-${Date.now()}-${uuidv4().substring(0, 8)}`
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        code: code,
        department_id: departmentId,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ qrCode: data })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
