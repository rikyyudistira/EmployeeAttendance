import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'
import { InstallPrompt } from '@/components/install-prompt'
import { I18nProvider } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Employee Attendance System',
  description: 'QR Code based employee attendance tracking with GPS verification',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Attendance',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <I18nProvider>
          {children}
        </I18nProvider>
        <Toaster position="top-center" />
        <ShadcnToaster />
        <InstallPrompt />
      </body>
    </html>
  )
}
