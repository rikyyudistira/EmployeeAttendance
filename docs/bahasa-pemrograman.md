# Bahasa Pemrograman yang Digunakan

1. **JavaScript/JSX**
   - Digunakan untuk membangun komponen antarmuka pengguna dengan React dan Next.js
   - File extension: `.jsx`
   - Contoh penggunaan:
     - Components (`components/*.jsx`)
     - Pages (`app/**/*.jsx`)
     - Hooks (`hooks/*.jsx`)

2. **JavaScript (Node.js)**
   - Digunakan untuk membangun API dan logika server
   - File extension: `.js`
   - Contoh penggunaan:
     - API Routes (`app/api/**/*.js`)
     - Utility functions (`lib/*.js`)
     - Configuration files (`next.config.js`)

3. **SQL**
   - Digunakan untuk manajemen database di Supabase
   - File extension: `.sql`
   - Contoh penggunaan:
     - Schema definitions
     - Database migrations
     - Row Level Security (RLS) policies

4. **CSS**
   - Tailwind CSS untuk styling
   - File extension: `.css`
   - Contoh penggunaan:
     - Global styles (`app/globals.css`)
     - Tailwind configuration (`tailwind.config.js`)

## Framework dan Library

1. **Next.js**
   - Framework React untuk full-stack development
   - Fitur yang digunakan:
     - App Router
     - API Routes
     - Server Components
     - Client Components

2. **React**
   - Library untuk membangun user interface
   - Fitur yang digunakan:
     - Hooks (useState, useEffect)
     - Components
     - Context API

3. **Supabase**
   - Backend-as-a-Service
   - Fitur yang digunakan:
     - Database PostgreSQL
     - Authentication
     - Storage
     - Row Level Security

## Tools Development

1. **Node.js**
   - Runtime JavaScript
   - Package manager (npm/yarn)
   - Development server

2. **Git**
   - Version control
   - Collaboration
   - Deployment

3. **VS Code**
   - Code editor
   - Extensions untuk development
   - Debugging tools

## Komponen Utama Aplikasi

1. **Frontend (Client-side)**
   - React + Next.js untuk UI
   - Tailwind CSS untuk styling
   - HTML5 QR Code Scanner
   - Geolocation API
   - Camera API

2. **Backend (Server-side)**
   - Next.js API Routes
   - Supabase Client
   - Authentication
   - File Storage

3. **Database**
   - PostgreSQL (Supabase)
   - Tables:
     - departments
     - qr_codes
     - attendance
     - users (auth)