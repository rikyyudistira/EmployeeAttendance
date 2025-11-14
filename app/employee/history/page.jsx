'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Calendar } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function EmployeeHistoryPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    
    // Set default date range (current month)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (user && startDate && endDate) {
      fetchAttendance()
    }
  }, [user, startDate, endDate])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
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
          <Button
            onClick={() => router.push('/employee')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Attendance History</h1>
          <p className="text-muted-foreground">View your past attendance records</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Your Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : attendance.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No attendance records found for the selected period
              </p>
            ) : (
              <div className="space-y-3">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium">{formatDate(record.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        Check-in: {formatTime(record.check_in)}
                        {record.check_out && ` • Check-out: ${formatTime(record.check_out)}`}
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

        {/* Summary */}
        {attendance.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {attendance.filter(a => a.status === 'present').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Present (On Time)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {attendance.filter(a => a.status === 'late').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Late Arrivals</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {attendance.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
