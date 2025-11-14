'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { QRDisplay } from '@/components/qr-display'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { QR_EXPIRY_MINUTES } from '@/lib/constants'
import { v4 as uuidv4 } from 'uuid'

export default function GenerateQRPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState(null)
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
    generateNewQR()
  }

  const generateNewQR = async () => {
    setLoading(true)
    try {
      // Get department (for demo, using first department)
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .limit(1)

      const departmentId = departments?.[0]?.id

      if (!departmentId) {
        console.error('No department found')
        setLoading(false)
        return
      }

      // Deactivate old QR codes
      await supabase
        .from('qr_codes')
        .update({ is_active: false })
        .eq('is_active', true)

      // Generate new QR code
      const qrId = uuidv4()
      const code = `${qrId}-${departmentId}-${Date.now()}-${uuidv4().substring(0, 8)}`
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + QR_EXPIRY_MINUTES)

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          code: code,
          department_id: departmentId,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setQrCode(data)
    } catch (error) {
      console.error('Error generating QR code:', error)
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
      
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <div>
          <Button
            onClick={() => router.push('/admin')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Generate QR Code</h1>
          <p className="text-muted-foreground">
            Display this QR code for employees to scan for attendance
          </p>
        </div>

        <QRDisplay qrCode={qrCode} onRefresh={generateNewQR} />

        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p className="font-semibold">Instructions:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>QR code expires every {QR_EXPIRY_MINUTES} minutes</li>
            <li>Display this on a monitor/screen at the office entrance</li>
            <li>Employees scan this code using their mobile app</li>
            <li>Click refresh to generate a new QR code manually</li>
            <li>QR codes auto-refresh when expired</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
