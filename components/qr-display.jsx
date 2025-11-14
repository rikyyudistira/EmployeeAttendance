'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Clock } from 'lucide-react'

export function QRDisplay({ qrCode, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!qrCode?.expires_at) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const expiry = new Date(qrCode.expires_at)
      const diff = Math.floor((expiry - now) / 1000)
      return Math.max(0, diff)
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const left = calculateTimeLeft()
      setTimeLeft(left)

      // Auto-refresh when expired
      if (left === 0 && onRefresh) {
        setTimeout(() => onRefresh(), 1000)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [qrCode, onRefresh])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!qrCode) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading QR code...</p>
        </CardContent>
      </Card>
    )
  }

  const isExpired = timeLeft === 0

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Active QR Code</CardTitle>
        <CardDescription>
          Employees scan this code to check in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 bg-white rounded-lg ${isExpired ? 'opacity-50' : ''}`}>
            <QRCodeSVG value={qrCode.code} size={200} level="H" />
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className={`text-lg font-mono ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
              {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
            </span>
          </div>

          {isExpired && (
            <p className="text-sm text-muted-foreground text-center">
              This QR code has expired. Click refresh to generate a new one.
            </p>
          )}

          <Button onClick={onRefresh} variant="outline" className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
