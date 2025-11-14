import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Admin-only endpoint to create a new employee account.
// Flow:
// 1) Verify requester is an authenticated admin (via cookie session)
// 2) Create Supabase Auth user (invite email by default, or with provided password)
// 3) Insert corresponding row into public.employees (id = auth user id)

export async function POST(request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user: requester } } = await supabase.auth.getUser()

    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = requester.user_metadata?.role || 'employee'
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      email,
      department_id,
      phone,
      password,      // optional: if provided, account is created with this password
      sendInvite = true // default: send invitation email for the user to set password
    } = body || {}

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Create auth user with service role
    const admin = createServiceClient()

    let userId = null
    if (sendInvite && !password) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { role: 'employee' },
      })
      if (error) {
        // Surface a clear message when user already exists
        const msg = error.message || 'Failed to invite user'
        return NextResponse.json({ error: msg }, { status: error.status || 400 })
      }
      userId = data?.user?.id || null
    } else {
      // Create immediate active account with provided password
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password is required and must be at least 6 characters when sendInvite is false' }, { status: 400 })
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'employee' },
      })
      if (error) {
        const msg = error.message || 'Failed to create user'
        return NextResponse.json({ error: msg }, { status: error.status || 400 })
      }
      userId = data?.user?.id || null
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unable to determine created user ID' }, { status: 500 })
    }

    // Insert into employees table (service role bypasses RLS safely on server)
    const { data: employee, error: insertError } = await admin
      .from('employees')
      .insert({
        id: userId,
        email,
        name,
        phone: phone || null,
        department_id: department_id || null,
        role: 'employee',
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      // Optional: rollback auth user creation (best-effort)
      try { await admin.auth.admin.deleteUser(userId) } catch (_) {}
      throw insertError
    }

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
