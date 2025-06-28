"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = createServerActionClient({ cookies })

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // 1. Attempt to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: signInError.message }
  }

  // 2. On success, get the user to determine their role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This case should rarely happen, but it's a good safeguard
    return { error: "Login successful, but failed to retrieve user details." }
  }

  // 3. Use the admin client to fetch the user's profile and role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    // If profile doesn't exist, sign out to prevent being stuck
    await supabase.auth.signOut()
    return { error: "Could not find a valid user profile. Please contact support." }
  }

  // 4. Determine the correct dashboard URL based on the role
  let redirectTo = "/"
  switch (profile.role) {
    case "student":
      redirectTo = "/student/dashboard"
      break
    case "program_manager":
      redirectTo = "/manager/dashboard"
      break
    case "admin":
      redirectTo = "/admin/dashboard"
      break
    case "super_admin":
      redirectTo = "/super-admin/dashboard"
      break
    default:
      // If role is unknown, sign out and redirect to a generic login
      await supabase.auth.signOut()
      redirectTo = "/"
      break
  }

  // 5. Perform the server-side redirect. This will be caught by Next.js.
  redirect(redirectTo)
}

// Update the signUp function
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const institutionId = formData.get("institutionId") as string

  if (!email || !password || !name || !role || !institutionId) {
    return { error: "All required fields are not provided." }
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

      // Add role-specific fields to the main profile
      if (role === "program_manager") {
        profileData.degree_id = formData.get("degreeId") as string
        profileData.academic_year = formData.get("academicYear") as string
      } else if (role === "student") {
        profileData.degree_id = formData.get("degreeId") as string
        profileData.academic_year = formData.get("academicYear") as string
        profileData.group_id = formData.get("groupId") as string
      }

      // Create profile using admin client to bypass RLS
      const { error: profileError } = await supabaseAdmin.from("profiles").insert(profileData)

      if (profileError) {
        console.error("Profile creation error:", profileError)
        return { error: "Database error saving new user." }
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
