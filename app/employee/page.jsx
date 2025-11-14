'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { StatsCard } from '@/components/stats-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QrCode, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 })
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
    setUser(user)
    fetchDashboardData(user.id)
  }

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', userId)
        .eq('date', today)
        .single()

      setTodayAttendance(attendance)

      // Fetch monthly stats
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthData } = await supabase
        .from('attendance')
        .select('status')
        .eq('employee_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])

      const stats = {
        present: monthData?.filter(a => a.status === 'present').length || 0,
        late: monthData?.filter(a => a.status === 'late').length || 0,
        absent: 0,
      }
      setStats(stats)
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
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Track your attendance here.</p>
        </div>

        {/* Today's Status */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Status</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={todayAttendance.status === 'present' ? 'success' : 'warning'}>
                    {todayAttendance.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check-in:</span>
                  <span className="font-medium">{formatTime(todayAttendance.check_in)}</span>
                </div>
                {todayAttendance.check_out && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Check-out:</span>
                    <span className="font-medium">{formatTime(todayAttendance.check_out)}</span>
                  </div>
                )}
                {!todayAttendance.check_out && (
                  <Button 
                    onClick={() => router.push('/employee/checkout')}
                    variant="outline"
                    className="w-full"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Check Out
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">You haven't checked in today</p>
                <Button onClick={() => router.push('/employee/scan')} className="w-full">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR to Check In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Present (On Time)"
            value={stats.present}
            icon={CheckCircle}
            description="This month"
          />
          <StatsCard
            title="Late Arrivals"
            value={stats.late}
            icon={Clock}
            description="This month"
          />
          <StatsCard
            title="Total Days"
            value={stats.present + stats.late}
            icon={Calendar}
            description="This month"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => router.push('/employee/scan')}
            size="lg"
            className="h-24"
          >
            <QrCode className="mr-2 h-6 w-6" />
            Scan QR Code
          </Button>
          <Button
            onClick={() => router.push('/employee/history')}
            variant="outline"
            size="lg"
            className="h-24"
          >
            <Calendar className="mr-2 h-6 w-6" />
            View History
          </Button>
        </div>
      </div>
    </div>
  )
}
