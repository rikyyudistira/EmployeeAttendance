import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Get all attendance for the month
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employees (id, name, email)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error

    // Get all employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, email')
      .eq('role', 'employee')

    // Calculate statistics per employee
    const stats = employees.map((employee) => {
      const empAttendance = attendance.filter(
        (a) => a.employee_id === employee.id
      )

      const present = empAttendance.filter((a) => a.status === 'present').length
      const late = empAttendance.filter((a) => a.status === 'late').length
      const totalDays = empAttendance.length

      return {
        employee,
        present,
        late,
        totalDays,
        attendanceRate: totalDays > 0 ? ((totalDays / 30) * 100).toFixed(1) : 0,
      }
    })

    return NextResponse.json({ stats, attendance })
  } catch (error) {
    console.error('Error fetching monthly report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
