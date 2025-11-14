'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, CameraOff } from 'lucide-react'

export function QRScanner({ onScanSuccess, onScanError }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  const startScanning = async () => {
    try {
      setError(null)
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code detected
          html5QrCode.stop().then(() => {
            setIsScanning(false)
            if (onScanSuccess) {
              onScanSuccess(decodedText)
            }
          })
        },
        (errorMessage) => {
          // Scanning error (can be ignored if just couldn't read)
          console.log('QR Scan Error:', errorMessage)
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('Failed to start camera. Please check permissions.')
      if (onScanError) {
        onScanError(err)
      }
    }
  }

  const stopScanning = () => {
    if (html5QrCodeRef.current && isScanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          setIsScanning(false)
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err)
        })
    }
  }

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Position the QR code within the camera frame
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id="qr-reader"
          className="w-full rounded-lg overflow-hidden"
          style={{ minHeight: isScanning ? '300px' : '0' }}
        />
        
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Scanner
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
