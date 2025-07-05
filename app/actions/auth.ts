"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"

// Update the signIn function
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

  // On success, simply return success. The client will handle the refresh.
  return { success: true }
}

// Update the signUp function
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

  try {
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
      // Base profile data
      const profileData: any = {
        id: authData.user.id,
        institution_id: institutionId,
        full_name: name,
        role,
        email,
      }

      // Add manager-specific fields if role is program_manager
      if (role === "program_manager") {
        profileData.degree_id = formData.get("degreeId") as string
        profileData.academic_year = formData.get("academicYear") as string
      }

      // Create profile using admin client to bypass RLS
      const { error: profileError } = await supabaseAdmin.from("profiles").insert(profileData)

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Provide a more generic error to the user
        return { error: "Database error saving new user." }
      }

      // For students, create student profile
      if (role === "student") {
        const groupId = formData.get("groupId") as string
        const enrollmentYear = formData.get("enrollmentYear") as string

        const { error: studentError } = await supabaseAdmin.from("student_profiles").insert({
          profile_id: authData.user.id,
          group_id: groupId,
          enrollment_year: enrollmentYear,
        })

        if (studentError) {
          console.error("Student profile creation error:", studentError)
          return { error: "Error creating student profile" }
        }
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Error in signUp:", err)
    return { error: "An unexpected error occurred" }
  }
}

export async function signOut(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()

  const redirectTo = formData.get("redirectTo") as string
  if (redirectTo) {
    redirect(redirectTo)
  } else {
    redirect("/")
  }
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
