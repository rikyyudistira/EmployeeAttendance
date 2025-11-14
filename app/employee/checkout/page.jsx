'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { QRScanner } from '@/components/qr-scanner'
import { CameraCapture } from '@/components/camera-capture'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { getCurrentLocation, validateGPSLocation } from '@/lib/validations'

export default function CheckoutPage() {
  const [step, setStep] = useState(1) // 1: QR, 2: GPS, 3: Photo, 4: Success
  const [user, setUser] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  }

  const handleQRScan = async (qrCode) => {
    setLoading(true)
    setError('')

    try {
      // Validate QR code with backend
      const response = await fetch('/api/qr-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: qrCode }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Invalid QR code')
      }

      setQrData(result.qrCode)
      setStep(2)
      // Automatically get GPS location
      await validateGPS(result.qrCode)
    } catch (error) {
      setError(error.message)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const validateGPS = async (qrCode) => {
    setLoading(true)
    setError('')

    try {
      const position = await getCurrentLocation()

      // For demo purposes, using fixed office location
      // In production, get from qrCode.department location
      const officeLat = -7.933222821622369
      const officeLng = 113.81382960430675

      const validation = validateGPSLocation(
        position.latitude,
        position.longitude,
        officeLat,
        officeLng
      )

      if (!validation.isValid) {
        throw new Error(
          `You are ${validation.distance}m away from the office. Must be within ${validation.radiusMeters}m.`
        )
      }

      setLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      })
      setStep(3)
    } catch (error) {
      setError(error.message)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoCapture = async (photoBlob) => {
    setLoading(true)
    setError('')

    try {
      // Upload photo to Supabase Storage
      const fileName = `${user.id}-checkout-${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, photoBlob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(fileName)

      // Find today's attendance record for this user
      const today = new Date().toISOString().split('T')[0]
      const { data: attendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .single()

      if (fetchError || !attendance) {
        throw new Error('No attendance record found for today. Cannot check out.')
      }

      if (attendance.check_out) {
        throw new Error('You have already checked out today.')
      }

      // Call server API to update check_out (use api/attendance/[id]/route.js)
      const now = new Date().toISOString()
      const res = await fetch(`/api/attendance/${attendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_out: now }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update check-out')
      }

      // Update photo_url (client-side) so photo is attached to attendance
      const { error: updatePhotoError } = await supabase
        .from('attendance')
        .update({ photo_url: publicUrl, location_lat: location.latitude, location_lng: location.longitude })
        .eq('id', attendance.id)

      if (updatePhotoError) throw updatePhotoError

      setStep(4)
      setTimeout(() => {
        router.push('/employee')
      }, 2000)
    } catch (error) {
      console.error('Error during checkout:', error)
      setError(error.message || 'Failed to complete check-out')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Check-Out Process</h1>
          <p className="text-muted-foreground">Follow the steps to mark your check-out</p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {/* Steps UI (simple) */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <p className="text-xs">Scan QR</p>
          </div>
          <div className="flex-1 h-0.5 bg-muted"></div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <p className="text-xs">GPS Check</p>
          </div>
          <div className="flex-1 h-0.5 bg-muted"></div>
          <div className={`flex-1 text-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <p className="text-xs">Take Photo</p>
          </div>
        </div>

        {step === 1 && (
          <QRScanner
            onScanSuccess={handleQRScan}
            onScanError={(err) => setError(err.message)}
          />
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Validating Location</CardTitle>
              <CardDescription>Checking your GPS location...</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <CameraCapture
            onCapture={handlePhotoCapture}
            onError={(err) => setError(err.message)}
          />
        )}

        {step === 4 && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Check-Out Successful!</h2>
              <p className="text-muted-foreground">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        )}

        {loading && step !== 2 && (
          <div className="mt-4 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  )
}
