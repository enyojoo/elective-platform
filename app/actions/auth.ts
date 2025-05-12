"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"

// Update the signIn function to use supabaseAdmin for profile checks
export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // For server actions, we need to create a new client each time
  // This is fine because it's server-side and won't cause the GoTrueClient warning
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user profile to determine redirect
  try {
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      return { error: "User not found" }
    }

    // ALWAYS use supabaseAdmin to bypass RLS for profile checks
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return { error: "Error fetching user profile" }
    }

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
  } catch (err) {
    console.error("Error in signIn:", err)
    return { error: "An unexpected error occurred" }
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

  // For server actions, we need to create a new client each time
  const supabase = createServerActionClient({ cookies })

  try {
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
      // Create profile using admin client to bypass RLS
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: authData.user.id,
        institution_id: institutionId,
        full_name: name,
        role,
        email,
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        return { error: "Error creating user profile" }
      }

      // For students, update the profile with student-specific data
      if (role === "student") {
        const groupId = formData.get("groupId") as string
        const enrollmentYear = formData.get("enrollmentYear") as string

        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({
            group_id: groupId,
            academic_year: enrollmentYear,
          })
          .eq("id", authData.user.id)

        if (profileUpdateError) {
          console.error("Student profile update error:", profileUpdateError)
          return { error: "Error updating student profile data" }
        }
      }

      // For program managers, update the profile with manager-specific data
      if (role === "program_manager") {
        const programId = formData.get("programId") as string

        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({
            program_id: programId,
          })
          .eq("id", authData.user.id)

        if (profileUpdateError) {
          console.error("Manager profile update error:", profileUpdateError)
          return { error: "Error updating manager profile data" }
        }
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Error in signUp:", err)
    return { error: "An unexpected error occurred" }
  }
}

export async function signOut() {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  redirect("/")
}

// Add a new function to ensure a user profile exists
export async function ensureUserProfile(userId: string, email: string, role: string, institutionId?: string) {
  try {
    // Check if profile exists using admin client to bypass RLS
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
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

      const { error: insertError } = await supabaseAdmin.from("profiles").insert(profileData)

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
  } catch (err) {
    console.error("Error in ensureUserProfile:", err)
    return { success: false, error: "An unexpected error occurred" }
  }
}
