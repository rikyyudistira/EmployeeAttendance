'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, BarChart3, TrendingUp } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function ReportsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [reportData, setReportData] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    
    // Set default to current month
    const now = new Date()
    setMonth((now.getMonth() + 1).toString().padStart(2, '0'))
    setYear(now.getFullYear().toString())
  }, [])

  useEffect(() => {
    if (user && month && year) {
      fetchReport()
    }
  }, [user, month, year])

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

  const fetchReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/monthly?month=${month}&year=${year}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const headers = ['Employee Name', 'Email', 'Present Days', 'Late Days', 'Total Days', 'Attendance Rate (%)']
    const rows = reportData.stats.map(stat => [
      stat.employee.name,
      stat.employee.email,
      stat.present,
      stat.late,
      stat.totalDays,
      stat.attendanceRate
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${year}-${month}.csv`
    a.click()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const chartData = reportData?.stats.map(stat => ({
    name: stat.employee.name.split(' ')[0],
    present: stat.present,
    late: stat.late,
  })) || []

  const pieData = reportData ? [
    { name: 'Present', value: reportData.stats.reduce((sum, s) => sum + s.present, 0), color: '#10b981' },
    { name: 'Late', value: reportData.stats.reduce((sum, s) => sum + s.late, 0), color: '#f59e0b' },
  ] : []

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
          <h1 className="text-3xl font-bold mb-2">Monthly Reports</h1>
          <p className="text-muted-foreground">View attendance statistics and analytics</p>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <Button onClick={exportToCSV} disabled={!reportData} className="sm:w-auto w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center py-8">Loading report...</p>
        ) : !reportData ? (
          <p className="text-center py-8 text-muted-foreground">No data available</p>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.stats.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Present</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.stats.reduce((sum, s) => sum + s.present, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Late</CardTitle>
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {reportData.stats.reduce((sum, s) => sum + s.late, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.stats.length > 0
                      ? (reportData.stats.reduce((sum, s) => sum + parseFloat(s.attendanceRate), 0) / reportData.stats.length).toFixed(1)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10b981" name="Present" />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Employee Table */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Attendance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Employee</th>
                        <th className="text-center p-2">Present</th>
                        <th className="text-center p-2">Late</th>
                        <th className="text-center p-2">Total Days</th>
                        <th className="text-center p-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.stats.map((stat, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{stat.employee.name}</p>
                              <p className="text-sm text-muted-foreground">{stat.employee.email}</p>
                            </div>
                          </td>
                          <td className="text-center p-2 text-green-600 font-medium">
                            {stat.present}
                          </td>
                          <td className="text-center p-2 text-yellow-600 font-medium">
                            {stat.late}
                          </td>
                          <td className="text-center p-2 font-medium">
                            {stat.totalDays}
                          </td>
                          <td className="text-center p-2 font-medium">
                            {stat.attendanceRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
