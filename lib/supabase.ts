import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
}

export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!)

// For server-side operations requiring admin privileges
export const supabaseAdmin = createClient<Database>(supabaseUrl!, supabaseServiceKey!)

console.log("Supabase client initialized with URL:", supabaseUrl)
