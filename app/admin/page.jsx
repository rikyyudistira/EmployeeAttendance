'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, Clock, XCircle, QrCode, BarChart } from 'lucide-react'
import { formatTime } from '@/lib/utils'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0,
  })
  const [todayAttendance, setTodayAttendance] = useState([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    const role = user.user_metadata?.role || 'employee'
    if (role !== 'admin') {
      router.push('/employee')
      return
    }
    
    setUser(user)
    fetchDashboardData()
  }

  const fetchDashboardData = async () => {
    try {
      // Get total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'employee')

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (name, email)
        `)
        .eq('date', today)

      setTodayAttendance(attendance || [])

      const presentCount = attendance?.filter(a => a.status === 'present').length || 0
      const lateCount = attendance?.filter(a => a.status === 'late').length || 0
      const absentCount = (employeeCount || 0) - (presentCount + lateCount)

      setStats({
        totalEmployees: employeeCount || 0,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor attendance and manage employees</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
            description="Registered"
          />
          <StatsCard
            title="Present (On Time)"
            value={stats.present}
            icon={CheckCircle}
            description="Today"
          />
          <StatsCard
            title="Late Arrivals"
            value={stats.late}
            icon={Clock}
            description="Today"
          />
          <StatsCard
            title="Absent"
            value={stats.absent}
            icon={XCircle}
            description="Today"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={() => router.push('/admin/employees')}
            size="lg"
            className="h-20"
            variant="outline"
          >
            <Users className="mr-2 h-6 w-6" />
            Manage Employees
          </Button>
          <Button
            onClick={() => router.push('/admin/generate-qr')}
            size="lg"
            className="h-20"
          >
            <QrCode className="mr-2 h-6 w-6" />
            Generate QR Code
          </Button>
          <Button
            onClick={() => router.push('/admin/attendance')}
            variant="outline"
            size="lg"
            className="h-20"
          >
            <CheckCircle className="mr-2 h-6 w-6" />
            View Attendance
          </Button>
          <Button
            onClick={() => router.push('/admin/reports')}
            variant="outline"
            size="lg"
            className="h-20"
          >
            <BarChart className="mr-2 h-6 w-6" />
            Monthly Reports
          </Button>
        </div>

        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records for today
              </p>
            ) : (
              <div className="space-y-2">
                {todayAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{record.employees?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        Check-in: {formatTime(record.check_in)}
                      </p>
                    </div>
                    <Badge
                      variant={record.status === 'present' ? 'success' : 'warning'}
                    >
                      {record.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
