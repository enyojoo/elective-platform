"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (profile) {
    switch (profile.role) {
      case "student":
        redirect("/student/dashboard")
      case "program_manager":
        redirect("/manager/dashboard")
      case "admin":
        redirect("/admin/dashboard")
      case "super_admin":
        redirect("/super-admin/dashboard")
      default:
        redirect("/")
    }
  }

  return { success: true }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const institutionId = formData.get("institutionId") as string

  if (!email || !password || !name || !role) {
    return { error: "All fields are required" }
  }

  const supabase = createServerActionClient({ cookies })

  // Create user in auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      institution_id: institutionId,
      full_name: name,
      role,
      email,
    })

    if (profileError) {
      return { error: profileError.message }
    }

    // For students, create student profile
    if (role === "student") {
      const groupId = formData.get("groupId") as string
      const enrollmentYear = formData.get("enrollmentYear") as string

      const { error: studentError } = await supabase.from("student_profiles").insert({
        profile_id: authData.user.id,
        group_id: groupId,
        enrollment_year: enrollmentYear,
      })

      if (studentError) {
        return { error: studentError.message }
      }
    }

    // For program managers, create manager profile
    if (role === "program_manager") {
      const programId = formData.get("programId") as string

      const { error: managerError } = await supabase.from("manager_profiles").insert({
        profile_id: authData.user.id,
        program_id: programId,
      })

      if (managerError) {
        return { error: managerError.message }
      }
    }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  redirect("/")
}

// Add a new function to ensure a user profile exists
export async function ensureUserProfile(userId: string, email: string, role: string, institutionId?: string) {
  const supabase = createServerActionClient({ cookies })

  // Check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single()

  if (fetchError && fetchError.code === "PGRST116") {
    // Profile doesn't exist, create it
    const profileData: any = {
      id: userId,
      email: email,
      role: role,
      created_at: new Date().toISOString(),
    }

    if (institutionId) {
      profileData.institution_id = institutionId
    }

    const { error: insertError } = await supabase.from("profiles").insert(profileData)

    if (insertError) {
      console.error("Error creating profile:", insertError)
      return { success: false, error: "Failed to create user profile" }
    }

    return { success: true }
  } else if (fetchError) {
    console.error("Error checking profile:", fetchError)
    return { success: false, error: "Error checking user profile" }
  }

  return { success: true }
}
