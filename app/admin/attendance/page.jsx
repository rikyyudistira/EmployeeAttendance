'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

export default function AttendancePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAttendance()
    }
  }, [selectedDate, user])

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
  }

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (name, email)
        `)
        .eq('date', selectedDate)
        .order('check_in', { ascending: false })

      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttendance = attendance.filter((record) => {
    const name = record.employees?.name?.toLowerCase() || ''
    const email = record.employees?.email?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    return name.includes(search) || email.includes(search)
  })

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
            onClick={() => router.push('/admin')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Attendance Records</h1>
          <p className="text-muted-foreground">View and monitor employee attendance</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="sm:w-48"
          />
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Attendance for {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredAttendance.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No attendance records found
              </p>
            ) : (
              <div className="space-y-2">
                {filteredAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium">{record.employees?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.employees?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium">{formatTime(record.check_in)}</p>
                      </div>
                      {record.check_out && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Check-out</p>
                          <p className="font-medium">{formatTime(record.check_out)}</p>
                        </div>
                      )}
                      <Badge
                        variant={record.status === 'present' ? 'success' : 'warning'}
                      >
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
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
