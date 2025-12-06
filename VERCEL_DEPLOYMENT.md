# Tutorial Deploy ke Vercel untuk Pemula

## Prasyarat
- Akun GitHub (proyek Anda sudah ada di GitHub)
- Akun Vercel (bisa dibuat gratis)
- Akun Supabase (untuk database)

## Step 1: Persiapan Proyek Lokal

### 1.1 Pastikan `.env.local` sudah ada
Buat file `.env.local` di root folder proyek dengan konfigurasi Supabase Anda:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Jangan commit file `.env.local` ke GitHub!** (sudah ada di `.gitignore`)

### 1.2 Push kode ke GitHub
```bash
git add .
git commit -m "Persiapan deployment ke Vercel"
git push origin main
```

## Step 2: Setup di Vercel

### 2.1 Buka Vercel
1. Kunjungi https://vercel.com
2. Klik **Sign Up** dan pilih **Continue with GitHub**
3. Authorize Vercel untuk akses repository GitHub Anda

### 2.2 Import Proyek
1. Setelah login, klik **Add New...** → **Project**
2. Cari repository `qr-absen` 
3. Klik **Import**

### 2.3 Konfigurasi Environment Variables
Pada halaman **Configure Project**, bagian **Environment Variables**:

1. Tambahkan variable berikut:
   - `NEXT_PUBLIC_SUPABASE_URL` = nilai dari Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = nilai dari Supabase  
   - `SUPABASE_SERVICE_ROLE_KEY` = nilai dari Supabase

2. Klik tombol input untuk setiap variable, masukkan nama dan nilai, lalu **Save**

**Catatan:** Variable yang dimulai dengan `NEXT_PUBLIC_` akan terlihat di browser (itu normal dan aman)

### 2.4 Deploy
1. Klik **Deploy**
2. Tunggu proses deployment selesai (biasanya 1-2 menit)
3. Jika berhasil, Anda akan melihat URL deployment seperti: `https://qr-absen.vercel.app`

## Step 3: Testing Setelah Deploy

### 3.1 Cek Aplikasi
1. Buka URL deployment yang diberikan Vercel
2. Test fitur-fitur penting:
   - Login
   - Scan QR Code
   - Generate QR Code
   - View Reports

### 3.2 Jika Ada Error
1. Buka **Deployments** → **View Logs**
2. Cari error message
3. Fix di lokal, push ke GitHub
4. Vercel akan auto-deploy

## Step 4: Update & Maintenance

### 4.1 Deploy Update
Setiap kali push ke `main` branch:
```bash
git push origin main
```
Vercel akan **otomatis deploy** tanpa perlu action apapun.

### 4.2 Preview Deploy (Testing sebelum production)
1. Buat branch baru: `git checkout -b feature/new-feature`
2. Buat Pull Request ke `main`
3. Vercel akan buat **preview URL** untuk testing
4. Setelah OK, merge PR ke `main`
5. Vercel deploy otomatis

## Step 5: Domain Custom (Opsional)

Jika ingin domain sendiri (bukan `vercel.app`):

1. Buka **Settings** → **Domains**
2. Klik **Add Domain**
3. Ikuti instruksi untuk setup DNS di provider domain Anda

## Troubleshooting

### Build Failed
- Buka **Deployments** → **View Logs**
- Cari error message
- Common issues:
  - Missing environment variables → tambahkan di Vercel Settings
  - Node version mismatch → check file `package.json`

### Aplikasi Loading Lambat
- Check **Analytics** di dashboard Vercel
- Optimize images dan assets

### Database Connection Error
- Verifikasi Supabase URL dan keys di environment variables
- Pastikan Supabase project active

## Tips Penting

✅ **DO:**
- Selalu test di preview deployment sebelum merge
- Monitor analytics di Vercel dashboard
- Set budget notifications untuk menghindari biaya tak terduga
- Backup database Supabase secara berkala

❌ **DON'T:**
- Jangan commit `.env.local` ke GitHub
- Jangan hardcode credentials di kode
- Jangan disable CSRF protection di production

## Useful Links
- https://vercel.com/docs
- https://nextjs.org/learn/basics/deploying-nextjs-app
- https://supabase.com/docs

---

**Butuh bantuan?** Check Vercel logs atau hubungi support Vercel di https://vercel.com/support
