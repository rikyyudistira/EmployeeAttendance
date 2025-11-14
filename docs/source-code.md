# Source Code Sistem Absensi QR

## Struktur Aplikasi
```
qr-absen/
├── app/                    # Next.js app router
│   ├── admin/             # Halaman admin
│   │   ├── attendance/    # Kelola absensi
│   │   ├── generate-qr/   # Generate QR code
│   │   └── reports/       # Laporan
│   ├── employee/          # Halaman karyawan
│   │   ├── scan/         # Scan QR (check-in)
│   │   ├── checkout/     # Check-out
│   │   └── history/      # Riwayat absensi
│   └── api/              # API routes
├── components/            # Komponen React
├── lib/                  # Utilitas & konfigurasi
└── public/               # Aset statis
```

## 1. Komponen Utama

### QR Scanner Component (components/qr-scanner.jsx)
```jsx
'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export function QRScanner({ onScanSuccess, onScanError }) {
  const [scanner, setScanner] = useState(null)

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    })

    qrScanner.render(
      (decodedText) => {
        onScanSuccess(decodedText)
        qrScanner.clear()
      },
      (error) => {
        onScanError(error)
      }
    )

    setScanner(qrScanner)

    return () => {
      scanner?.clear()
    }
  }, [])

  return <div id="reader"></div>
}
```

### Camera Capture Component (components/camera-capture.jsx)
```jsx
'use client'

import { useRef, useState } from 'react'
import { Button } from './ui/button'
import { Camera, RefreshCcw } from 'lucide-react'

export function CameraCapture({ onCapture, onError }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      videoRef.current.srcObject = stream
      setStream(stream)
      setError('')
    } catch (err) {
      setError('Tidak dapat mengakses kamera')
      onError(err)
    }
  }

  const capturePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    
    canvas.toBlob((blob) => {
      onCapture(blob)
      stopCamera()
    }, 'image/jpeg', 0.8)
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  return (
    <div className="space-y-4">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full rounded-lg"
      />
      
      <div className="flex justify-center space-x-2">
        {!stream ? (
          <Button onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />
            Buka Kamera
          </Button>
        ) : (
          <>
            <Button onClick={capturePhoto}>
              <Camera className="mr-2 h-4 w-4" />
              Ambil Foto
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
```

## 2. Halaman Utama

### Check-In Page (app/employee/scan/page.jsx)
```jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { QRScanner } from '@/components/qr-scanner'
import { CameraCapture } from '@/components/camera-capture'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { getCurrentLocation, validateGPSLocation } from '@/lib/validations'

export default function ScanPage() {
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
    try {
      const response = await fetch('/api/qr-code/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: qrCode }),
      })

      if (!response.ok) throw new Error('QR Code tidak valid')
      
      const result = await response.json()
      setQrData(result.qrCode)
      setStep(2)
      await validateGPS(result.qrCode)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateGPS = async (qrCode) => {
    try {
      const position = await getCurrentLocation()
      const validation = validateGPSLocation(
        position.latitude,
        position.longitude,
        qrCode.department.location_lat,
        qrCode.department.location_lng
      )

      if (!validation.isValid) {
        throw new Error(`Anda ${validation.distance}m dari lokasi. Harus dalam radius ${validation.radiusMeters}m.`)
      }

      setLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      })
      setStep(3)
    } catch (error) {
      setError(error.message)
      setStep(1)
    }
  }

  const handlePhotoCapture = async (photoBlob) => {
    setLoading(true)
    try {
      // Upload foto ke Supabase Storage
      const fileName = `${user.id}-${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, photoBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(fileName)

      // Buat record absensi
      const now = new Date()
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          employee_id: user.id,
          date: now.toISOString().split('T')[0],
          check_in: now.toISOString(),
          location_lat: location.latitude,
          location_lng: location.longitude,
          photo_url: publicUrl,
          qr_code_id: qrData.id,
        })

      if (insertError) throw insertError

      setStep(4)
      setTimeout(() => {
        router.push('/employee')
      }, 2000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Render steps & UI components...
}
```

### Check-Out Page (app/employee/checkout/page.jsx)
```jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QRScanner } from '@/components/qr-scanner'
import { CameraCapture } from '@/components/camera-capture'

export default function CheckoutPage() {
  // State setup similar to ScanPage...

  const handlePhotoCapture = async (photoBlob) => {
    setLoading(true)
    try {
      // Upload foto
      const fileName = `${user.id}-checkout-${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, photoBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(fileName)

      // Cari record absensi hari ini
      const today = new Date().toISOString().split('T')[0]
      const { data: attendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .eq('date', today)
        .single()

      if (fetchError || !attendance) {
        throw new Error('Belum ada record absensi hari ini')
      }

      // Update check-out time
      const now = new Date().toISOString()
      const res = await fetch(`/api/attendance/${attendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_out: now }),
      })

      if (!res.ok) throw new Error('Gagal update check-out')

      // Update foto
      const { error: updatePhotoError } = await supabase
        .from('attendance')
        .update({ 
          photo_url: publicUrl,
          location_lat: location.latitude,
          location_lng: location.longitude 
        })
        .eq('id', attendance.id)

      if (updatePhotoError) throw updatePhotoError

      setStep(4)
      setTimeout(() => {
        router.push('/employee')
      }, 2000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Render steps & UI components...
}
```

## 3. API Routes

### QR Code Validation (app/api/qr-code/validate/route.js)
```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const { code } = await request.json()
    const supabase = await createClient()

    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*, department:departments(*)')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !qrCode) {
      return NextResponse.json(
        { error: 'QR Code tidak valid' },
        { status: 404 }
      )
    }

    // Check expiry
    const now = new Date()
    const expiresAt = new Date(qrCode.expires_at)
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'QR Code sudah kedaluwarsa' },
        { status: 400 }
      )
    }

    return NextResponse.json({ qrCode })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Attendance Update (app/api/attendance/[id]/route.js)
```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient()
    const { id } = params
    const { check_out } = await request.json()

    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ attendance: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 4. Utilitas

### Validasi GPS (lib/validations.js)
```javascript
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error)
    )
  })
}

export function validateGPSLocation(lat1, lon1, lat2, lon2, radius = 100) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c

  return {
    isValid: distance <= radius,
    distance: Math.round(distance),
    radiusMeters: radius
  }
}
```

### Supabase Client (lib/supabase/client.js)
```javascript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

## 5. Schema Database (Supabase)

```sql
-- Departments
create table public.departments (
  id uuid not null default extensions.uuid_generate_v4(),
  name text not null,
  location_lat numeric(10,8) not null,
  location_lng numeric(11,8) not null,
  radius_meters integer null default 100,
  created_at timestamp with time zone null default now(),
  constraint departments_pkey primary key (id)
);

-- QR Codes
create table public.qr_codes (
  id uuid not null default extensions.uuid_generate_v4(),
  code text not null,
  department_id uuid not null references public.departments(id),
  expires_at timestamp with time zone not null,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  constraint qr_codes_pkey primary key (id)
);

-- Attendance
create table public.attendance (
  id uuid not null default extensions.uuid_generate_v4(),
  employee_id uuid not null references auth.users(id),
  date date not null,
  check_in timestamp with time zone not null,
  check_out timestamp with time zone null,
  location_lat numeric(10,8) not null,
  location_lng numeric(11,8) not null,
  photo_url text null,
  qr_code_id uuid not null references public.qr_codes(id),
  status text not null check (status in ('present', 'late')),
  created_at timestamp with time zone null default now(),
  constraint attendance_pkey primary key (id)
);
```

## Teknologi yang Digunakan

1. **Frontend**
   - Next.js 13+ (App Router)
   - React
   - Tailwind CSS
   - shadcn/ui (Komponen UI)

2. **Backend**
   - Supabase (Database & Auth)
   - Next.js API Routes
   - Vercel (Hosting)

3. **Library Utama**
   - html5-qrcode (QR Scanner)
   - @supabase/ssr (Supabase Client)
   - lucide-react (Icons)

4. **Fitur Utama**
   - Autentikasi (Login/Logout)
   - Scan QR Code
   - Validasi Lokasi (GPS)
   - Capture Foto
   - Check-in/Check-out
   - Riwayat Absensi
   - Generate QR Code (Admin)
   - Laporan Absensi (Admin)