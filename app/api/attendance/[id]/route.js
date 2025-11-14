import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Update attendance (check-out)
export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { check_out } = await request.json()

    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ attendance: data })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
