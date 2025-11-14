import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // Provide a clearer runtime error to help debugging environment issues
    throw new Error('Missing environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\nPlease set them in .env.local and restart the dev server.')
  }

  return createBrowserClient(url, anonKey)
}
