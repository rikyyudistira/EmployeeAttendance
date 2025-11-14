# Employee Attendance PWA System

A comprehensive Employee Attendance tracking application with QR code scanning, GPS validation, selfie verification, and real-time monitoring.

## Features

### Core Features
- ✅ **QR Code Attendance System** - Dynamic QR codes that expire every 5 minutes
- 📍 **GPS Location Validation** - Ensure employees are within 100m of office
- 📸 **Selfie Verification** - Mandatory photo capture for identity validation
- 👤 **Role-Based Access** - Separate dashboards for Admins and Employees
## Admin: Create Employees In-App

To create employee accounts directly from the app (without Supabase Dashboard):

1) Add this to your `.env.local` and restart the dev server:

```
NEXT_PUBLIC_SUPABASE_URL=...           # already required
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # already required
SUPABASE_SERVICE_ROLE_KEY=...          # REQUIRED for admin user creation API
```

2) Login as an admin and open: `/admin/add-employee`

Flow: The server will create a Supabase Auth user (invite by email by default) and insert a row into `employees` with the same `id`.

Notes:
- If you toggle off "Kirim undangan via email", you must provide an initial password (min 6 chars). The account is created and confirmed immediately.
- Only users with `user_metadata.role = "admin"` can access this page and API.

- 📱 **Progressive Web App (PWA)** - Install as mobile app
- 📊 **Real-Time Monitoring** - Track attendance in real-time
- 📈 **Analytics & Reports** - Monthly reports with charts and statistics

### Employee Features
- Scan QR code to check in/out
- View personal attendance history
- Monthly statistics dashboard
- Calendar view of attendance
- Status tracking (Present/Late/Absent)

### Admin Features
- Generate dynamic QR codes
- View today's attendance in real-time
- Monthly attendance reports
- Employee management
- Export data to CSV
- Attendance charts and analytics

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for selfie photos)
- **Styling**: Tailwind CSS, shadcn/ui
- **QR Code**: html5-qrcode (scanning), qrcode.react (generation)
- **Camera**: react-webcam
- **Charts**: recharts
- **PWA**: next-pwa

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- Supabase account
- Modern web browser with camera support

### 2. Supabase Setup

#### A. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for initialization

#### B. Run Database Schema

Go to SQL Editor in Supabase and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_lat DECIMAL(10,8) NOT NULL,
  location_lng DECIMAL(11,8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (linked to Supabase Auth)
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  department_id UUID REFERENCES departments(id),
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Codes table
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out TIMESTAMP WITH TIME ZONE,
  location_lat DECIMAL(10,8) NOT NULL,
  location_lng DECIMAL(11,8) NOT NULL,
  photo_url TEXT NOT NULL,
  qr_code_id UUID REFERENCES qr_codes(id),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_employee_date UNIQUE(employee_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date DESC);
CREATE INDEX idx_qr_expires ON qr_codes(expires_at) WHERE is_active = true;
CREATE INDEX idx_employees_department ON employees(department_id);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view own profile or admin can view all"
ON employees FOR SELECT
USING (
  auth.uid() = id 
  OR 
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can update employees"
ON employees FOR UPDATE
USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for attendance
CREATE POLICY "Employees can view own attendance or admin can view all"
ON attendance FOR SELECT
USING (
  employee_id = auth.uid() 
  OR 
  EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Employees can insert own attendance"
ON attendance FOR INSERT
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update own attendance"
ON attendance FOR UPDATE
USING (employee_id = auth.uid());

-- RLS Policies for QR codes
CREATE POLICY "Anyone authenticated can view active QR codes"
ON qr_codes FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admin can manage QR codes"
ON qr_codes FOR ALL
USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for departments
CREATE POLICY "Anyone authenticated can view departments"
ON departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage departments"
ON departments FOR ALL
USING (EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'));

-- Insert sample department
INSERT INTO departments (name, location_lat, location_lng, radius_meters)
VALUES ('Head Office', -6.200000, 106.816666, 100);
```

#### C. Create Storage Bucket

1. Go to Storage in Supabase
2. Create a new bucket called `attendance-photos`
3. Make it **public** or set RLS policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attendance-photos');

-- Allow public to read photos
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-photos');
```

#### D. Create Test Users

1. Go to Authentication → Users
2. Click "Add User"
3. Create admin:
   - Email: admin@company.com
   - Password: admin123
   - Click "Create user"
   - Note the User ID (UUID)
4. Create employee:
   - Email: employee@company.com
   - Password: employee123
   - Note the User ID (UUID)

#### E. Link Users to Employees Table

Run in SQL Editor (replace UUIDs with actual IDs from step D):

```sql
INSERT INTO employees (id, email, name, department_id, role)
VALUES 
  ('PASTE_ADMIN_UUID_HERE', 'admin@company.com', 'Admin User', 
   (SELECT id FROM departments LIMIT 1), 'admin'),
  ('PASTE_EMPLOYEE_UUID_HERE', 'employee@company.com', 'John Doe', 
   (SELECT id FROM departments LIMIT 1), 'employee');
```

### 3. Environment Setup

The `.env` file is already configured with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://srerwbbngywzuvgmeeqn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Install Dependencies

Already installed! Dependencies include:
- @supabase/supabase-js, @supabase/ssr
- html5-qrcode, qrcode.react
- react-webcam
- recharts
- next-pwa
- And all shadcn/ui components

### 5. Run Development Server

The server is already running at:
- **Local**: http://localhost:3000
- **Preview**: https://clockin-14.preview.emergentagent.com

## Usage Guide

### For Employees:

1. **Login**: Use employee@company.com / employee123
2. **Check-In**:
   - Click "Scan QR Code"
   - Allow camera permissions
   - Scan the QR code displayed by admin
   - Allow GPS permissions
   - Take a selfie photo
   - Confirm and submit
3. **View Dashboard**: See today's status and monthly stats
4. **Check History**: View past attendance records

### For Admins:

1. **Login**: Use admin@company.com / admin123
2. **Generate QR Code**:
   - Go to "Generate QR Code"
   - Display on screen for employees
   - QR auto-refreshes every 5 minutes
3. **Monitor Attendance**:
   - View real-time check-ins on dashboard
   - See who's present, late, or absent
4. **View Reports**:
   - Access monthly reports
   - View charts and statistics
   - Export to CSV

## Business Rules

- **Working Hours**: 08:00 - 16:00 WIB
- **On Time**: Check-in at or before 08:00
- **Late**: Check-in after 08:00
- **QR Expiry**: 5 minutes
- **GPS Radius**: 100 meters from office
- **One Check-in Per Day**: Duplicate prevention
- **Mandatory Selfie**: Identity verification

## PWA Installation

### On Mobile (Chrome/Safari):
1. Visit the app URL
2. Look for "Add to Home Screen" prompt
3. Or use browser menu → "Add to Home Screen"
4. App icon will appear on home screen

### On Desktop (Chrome/Edge):
1. Visit the app URL
2. Click the install button in address bar
3. Or click the prompt that appears

## Troubleshooting

### Camera Not Working
- Ensure HTTPS is used (required for camera access)
- Check browser permissions
- Try a different browser

### GPS Not Working
- Enable location services on device
- Grant location permissions to browser
- For testing, modify GPS coordinates in code

### QR Code Invalid
- Check if QR code has expired (5 minutes)
- Admin should generate a new QR code
- Verify Supabase database connection

### Supabase Errors
- Check RLS policies are correctly set
- Verify user roles in employees table
- Check storage bucket permissions

## Development Notes

- **Hot Reload**: Enabled for both frontend and backend
- **Testing**: Use provided test accounts
- **GPS Mock**: For testing, you can temporarily disable GPS validation
- **Storage**: Photos are stored in Supabase Storage

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control
- JWT authentication via Supabase
- Encrypted QR codes
- GPS validation
- Photo verification

## Future Enhancements

- [ ] Email notifications
- [ ] Push notifications for PWA
- [ ] Fingerprint authentication
- [ ] Face recognition
- [ ] Multiple departments support
- [ ] Holiday calendar
- [ ] Leave management
- [ ] Overtime tracking

## Support

For issues or questions, please check:
1. Supabase dashboard for database errors
2. Browser console for frontend errors
3. Server logs for backend errors

## License

MIT License - Free to use and modify

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies**
