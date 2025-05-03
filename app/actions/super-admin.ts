"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"

export async function createInstitution(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "super_admin") {
    return { error: "Forbidden" }
  }

  const name = formData.get("name") as string
  const subdomain = formData.get("subdomain") as string
  const domain = (formData.get("domain") as string) || null
  const plan = (formData.get("plan") as string) || "free"

  if (!name || !subdomain) {
    return { error: "Name and subdomain are required" }
  }

  // Check if subdomain is available
  const { data: existingInstitution } = await supabase
    .from("institutions")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle()

  if (existingInstitution) {
    return { error: "Subdomain is already taken" }
  }

  // Create institution
  const { data: institution, error } = await supabase
    .from("institutions")
    .insert({
      name,
      subdomain,
      domain,
      subscription_plan: plan,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/super-admin/institutions")
  return { success: true, institution }
}

export async function createInstitutionAdmin(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "super_admin") {
    return { error: "Forbidden" }
  }

  const institutionId = formData.get("institutionId") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!institutionId || !email || !password || !name) {
    return { error: "All fields are required" }
  }

  // Create admin user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    // Create admin profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      institution_id: institutionId,
      full_name: name,
      role: "admin",
      email,
    })

    if (profileError) {
      return { error: profileError.message }
    }
  }

  revalidatePath(`/super-admin/institutions/${institutionId}`)
  return { success: true }
}
