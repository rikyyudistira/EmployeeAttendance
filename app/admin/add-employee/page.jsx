"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

export default function AddEmployeePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ name: '', email: '', department_id: '', phone: '', sendInvite: true, password: '' })
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    init()
    toast({ title: 'Halo Admin!', description: 'Gunakan form ini untuk menambahkan pegawai baru ke sistem.' })
  }, [])

  const init = async () => {
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
    await fetchDepartments()
    setLoading(false)
  }

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name', { ascending: true })
    setDepartments(data || [])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!form.name || !form.email) {
        toast({ title: 'Form tidak lengkap', description: 'Nama dan email wajib diisi', variant: 'destructive' })
        return
      }
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        department_id: form.department_id || null,
        phone: form.phone?.trim() || null,
        sendInvite: form.sendInvite,
        password: form.sendInvite ? undefined : form.password,
      }
      const res = await fetch('/api/employees/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal membuat akun pegawai')
      }
      toast({ title: 'Berhasil', description: form.sendInvite ? 'Undangan telah dikirim ke email pegawai.' : 'Akun pegawai berhasil dibuat.' })
      router.push('/admin/employees')
    } catch (err) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
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
      <div className="container mx-auto px-4 py-8 max-w-2xl ">
         <div>
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Tambah Pegawai</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. HP (opsional)</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Departemen</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm(f => ({ ...f, department_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih departemen (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium">Kirim undangan via email</p>
                  <p className="text-sm text-muted-foreground">Jika dimatikan, isi password awal untuk akun pegawai.</p>
                </div>
                <Switch
                  checked={form.sendInvite}
                  onCheckedChange={(v) => setForm(f => ({ ...f, sendInvite: v, password: v ? '' : f.password }))}
                />
              </div>

              {!form.sendInvite && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password Awal</Label>
                  <Input id="password" type="password" minLength={6} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => router.push('/admin')}>Batal</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
