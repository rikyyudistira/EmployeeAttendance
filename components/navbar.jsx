'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User, QrCode, LayoutDashboard, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar({ user }) {
  const { lang, setLang, t } = useI18n();
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAdmin = user?.user_metadata?.role === 'admin'

  const goDashboard = () => {
    setMobileOpen(false)
    router.push(isAdmin ? '/admin' : '/employee')
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <QrCode className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">{t('attendanceSystem')}</h1>
        </div>

        {/* Desktop / tablet menu */}
        <div className="hidden md:flex items-center space-x-4">
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-none"
            style={{ minWidth: 70 }}
            aria-label="Switch language"
          >
            <option value="id">IDN</option>
            <option value="en">ENG</option>
          </select>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.email}</span>
            {isAdmin && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {t('admin')}
              </span>
            )}
          </div>

          <Button onClick={goDashboard} variant="ghost" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t('dashboard')}
          </Button>

          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            {t('logout')}
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-none mr-2"
            aria-label="Switch language"
            style={{ minWidth: 70 }}
          >
            <option value="id">IDN</option>
            <option value="en">ENG</option>
          </select>
          <Button variant="ghost" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu panel */}
  {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <div>
                  <div className="text-sm">{user?.email}</div>
                  {isAdmin && <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded inline-block mt-1">{t('admin')}</div>}
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button onClick={goDashboard} variant="ghost" className="justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('dashboard')}
              </Button>

              <Button onClick={handleLogout} variant="outline" className="justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}