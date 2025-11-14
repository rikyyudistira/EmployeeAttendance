import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ employees: data })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { name, email, department_id, role = 'employee' } = body || {}

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({ name, email, department_id, role })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ employee: data })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
