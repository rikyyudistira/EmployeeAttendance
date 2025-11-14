'use client'

import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, RotateCcw, CheckCircle } from 'lucide-react'

export function CameraCapture({ onCapture, onError }) {
  const webcamRef = useRef(null)
  const [imgSrc, setImgSrc] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImgSrc(imageSrc)
    }
  }, [webcamRef])

  const retake = () => {
    setImgSrc(null)
  }

  const confirmPhoto = async () => {
    if (!imgSrc) return

    setIsLoading(true)
    try {
      // Convert base64 to blob
      const response = await fetch(imgSrc)
      const blob = await response.blob()
      
      // Compress image if needed (max 500KB)
      if (blob.size > 500000) {
        // Simple compression by reducing quality
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)
            canvas.toBlob(
              (compressedBlob) => {
                onCapture(compressedBlob)
                resolve()
              },
              'image/jpeg',
              0.7
            )
          }
          img.src = imgSrc
        })
      } else {
        onCapture(blob)
      }
    } catch (error) {
      console.error('Error processing photo:', error)
      if (onError) onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Take Selfie</CardTitle>
        <CardDescription>
          Capture your photo for attendance verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative rounded-lg overflow-hidden bg-black">
          {!imgSrc ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full"
              videoConstraints={{
                facingMode: 'user',
                width: 640,
                height: 480,
              }}
            />
          ) : (
            <img src={imgSrc} alt="Captured" className="w-full" />
          )}
        </div>

        <div className="flex gap-2">
          {!imgSrc ? (
            <Button onClick={capture} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
          ) : (
            <>
              <Button onClick={retake} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button
                onClick={confirmPhoto}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
