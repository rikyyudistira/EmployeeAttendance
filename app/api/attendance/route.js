import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get attendance records
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees (name, email)
      `)
      .order('date', { ascending: false })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ attendance: data })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create attendance (check-in)
export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('attendance')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ attendance: data })
  } catch (error) {
    console.error('Error creating attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
