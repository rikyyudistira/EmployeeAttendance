# Supabase Database Setup Guide

## Step 1: Run Database Schema

Go to your Supabase project → SQL Editor → New Query

Copy and paste this entire SQL script and click "RUN":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_lat DECIMAL(10,8) NOT NULL,
  location_lng DECIMAL(11,8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS employees (
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
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
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
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_qr_expires ON qr_codes(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON employees;
DROP POLICY IF EXISTS "Admin can update employees" ON employees;
DROP POLICY IF EXISTS "Employees can view own attendance or admin can view all" ON attendance;
DROP POLICY IF EXISTS "Employees can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Employees can update own attendance" ON attendance;
DROP POLICY IF EXISTS "Anyone authenticated can view active QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Admin can manage QR codes" ON qr_codes;
DROP POLICY IF EXISTS "Anyone authenticated can view departments" ON departments;
DROP POLICY IF EXISTS "Admin can manage departments" ON departments;

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

-- Insert sample department (only if not exists)
INSERT INTO departments (name, location_lat, location_lng, radius_meters)
SELECT 'Head Office', -6.200000, 106.816666, 100
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Head Office');
```

## Step 2: Create Storage Bucket

1. Go to **Storage** in Supabase
2. Click **"New bucket"**
3. Name: `attendance-photos`
4. **Public bucket**: ✅ Check this box (or set policies below)
5. Click **"Create bucket"**

### Optional: If you want private bucket with policies

Go to SQL Editor and run:

```sql
-- Allow authenticated users to upload
INSERT INTO storage.policies (name, bucket_id, action, definition)
VALUES (
  'Authenticated users can upload photos',
  'attendance-photos',
  'INSERT',
  'auth.role() = ''authenticated'''
);

-- Allow anyone to read photos
INSERT INTO storage.policies (name, bucket_id, action, definition)
VALUES (
  'Anyone can view photos',
  'attendance-photos',
  'SELECT',
  'true'
);
```

## Step 3: Create Test Users

### A. Create Admin User

1. Go to **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@company.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ Yes
4. Click **"Create user"**
5. **IMPORTANT**: Copy the **User UUID** (you'll need it in next step)

### B. Create Employee User

1. Click **"Add user"** → **"Create new user"** again
2. Fill in:
   - **Email**: `employee@company.com`
   - **Password**: `employee123`
   - **Auto Confirm User**: ✅ Yes
3. Click **"Create user"**
4. **IMPORTANT**: Copy the **User UUID**

## Step 4: Update User Metadata (Set Roles)

For each user, you need to add their role to metadata:

### Option A: Via Supabase Dashboard (Easier)

1. Go to **Authentication → Users**
2. Click on the admin user
3. Scroll to **"User metadata"**
4. Click **"Edit"**
5. Add this JSON:
```json
{
  "role": "admin"
}
```
6. Click **"Save"**
7. Repeat for employee user with `"role": "employee"`

### Option B: Via SQL (Alternative)

Go to SQL Editor and run (replace UUIDs):

```sql
-- Update admin user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@company.com';

-- Update employee user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "employee"}'::jsonb
WHERE email = 'employee@company.com';
```

## Step 5: Link Users to Employees Table

Go to SQL Editor and run (replace UUIDs with actual User IDs from Step 3):

```sql
-- Insert admin into employees table
INSERT INTO employees (id, email, name, department_id, role)
VALUES (
  'PASTE_ADMIN_UUID_HERE',
  'admin@company.com',
  'Admin User',
  (SELECT id FROM departments WHERE name = 'Head Office' LIMIT 1),
  'admin'
) ON CONFLICT (id) DO NOTHING;

-- Insert employee into employees table
INSERT INTO employees (id, email, name, department_id, role)
VALUES (
  'PASTE_EMPLOYEE_UUID_HERE',
  'employee@company.com',
  'John Doe',
  (SELECT id FROM departments WHERE name = 'Head Office' LIMIT 1),
  'employee'
) ON CONFLICT (id) DO NOTHING;
```

## Step 6: Verify Setup

Run this query to verify everything is set up correctly:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('departments', 'employees', 'qr_codes', 'attendance');

-- Check departments
SELECT * FROM departments;

-- Check employees
SELECT id, email, name, role FROM employees;

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'attendance-photos';
```

You should see:
- ✅ 4 tables (departments, employees, qr_codes, attendance)
- ✅ 1 department (Head Office)
- ✅ 2 employees (admin and employee)
- ✅ 1 storage bucket (attendance-photos)

## Step 7: Test Login

1. Go to your app URL
2. Login with:
   - **Admin**: admin@company.com / admin123
   - **Employee**: employee@company.com / employee123

## Troubleshooting

### Issue: "User not found" or "Invalid login"
- Make sure you created users in Authentication
- Verify emails match exactly
- Check "Auto Confirm User" was enabled

### Issue: "Unauthorized" or "Access denied"
- Check user metadata has correct role
- Verify users exist in employees table
- Check RLS policies are enabled

### Issue: "Cannot upload photo"
- Verify attendance-photos bucket exists
- Check bucket is public OR policies are set
- Ensure storage policies allow authenticated users

### Issue: "QR code generation fails"
- Make sure department exists in departments table
- Check admin user has role='admin' in employees table

## Additional Notes

- **GPS Coordinates**: Default office location is `-6.200000, 106.816666` (Jakarta, Indonesia)
- To change office location, update the departments table
- **QR Expiry**: Default is 5 minutes (can be changed in app settings)
- **Working Hours**: 08:00-16:00 (can be modified in constants.js)

## Next Steps

After setup is complete:
1. Test admin login and QR generation
2. Test employee login and QR scanning
3. Test photo upload
4. Verify attendance records are saved
5. Check monthly reports

---

**Setup Complete! 🎉**

Your Employee Attendance System is now ready to use!
