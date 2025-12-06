import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request, { params }) {
  try {
    const supabase = await createServerSupabase()
    const id = params.id

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ employee: data })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user: requester } } = await supabase.auth.getUser()

    if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = requester.user_metadata?.role || 'employee'
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = params.id
    const body = await request.json()
    const { name, email, phone, department_id, is_active, role: newRole } = body || {}

    const admin = createServiceClient()

    // Update employees table
    const { data, error } = await admin
      .from('employees')
      .update({ name, email, phone, department_id, is_active, role: newRole })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If role changed, update auth user's metadata
    if (newRole) {
      try {
        await admin.auth.admin.updateUserById(id, { user_metadata: { role: newRole } })
      } catch (err) {
        // non-fatal, log and continue
        console.warn('Failed to update auth user metadata:', err)
      }
    }

    return NextResponse.json({ employee: data })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user: requester } } = await supabase.auth.getUser()

    if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = requester.user_metadata?.role || 'employee'
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = params.id
    const admin = createServiceClient()

    // Delete employee row from employees table
    const { error: deleteEmployeeError } = await admin
      .from('employees')
      .delete()
      .eq('id', id)

    if (deleteEmployeeError) throw deleteEmployeeError

    // Delete auth user from Authentication
    try {
      await admin.auth.admin.deleteUser(id)
    } catch (err) {
      console.error('Warning: Failed to delete auth user:', err.message)
      // Don't throw here - employee was already deleted from table
      // but log the error for manual cleanup if needed
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
