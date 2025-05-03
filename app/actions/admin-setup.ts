"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function ensureAdminUserExists(institutionId: string) {
  const cookieStore = cookies()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  // Check if admin user exists for this institution
  const { data: existingAdmin, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("role", "admin")
    .limit(1)

  if (checkError) {
    console.error("Error checking for admin user:", checkError)
    return { success: false, error: checkError.message }
  }

  // If admin already exists, return
  if (existingAdmin && existingAdmin.length > 0) {
    return { success: true, message: "Admin user already exists" }
  }

  try {
    // Create a demo admin user if none exists
    const email = `admin@${institutionId}.electivepro.com`
    const password = "Admin123!" // This should be changed immediately in production

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Create profile record
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authUser.user.id,
      email: email,
      full_name: "Demo Admin",
      role: "admin",
      institution_id: institutionId,
      is_active: true,
    })

    if (profileError) throw profileError

    return { success: true, message: "Demo admin user created successfully" }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    return { success: false, error: error.message }
  }
}
