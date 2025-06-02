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

      // For program managers, create manager profile
      if (role === "program_manager") {
        const programId = formData.get("programId") as string

        const { error: managerError } = await supabaseAdmin.from("manager_profiles").insert({
          profile_id: authData.user.id,
          program_id: programId,
        })

        if (managerError) {
          console.error("Manager profile creation error:", managerError)
          return { error: "Error creating manager profile" }
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

  const userRoleContext = formData.get("userRoleContext") as string | null

  if (userRoleContext === "student") {
    redirect("/student/login")
  } else if (userRoleContext === "manager") {
    redirect("/manager/login")
  } else if (userRoleContext === "admin") {
    redirect("/admin/login")
  } else if (userRoleContext === "super_admin") {
    redirect("/super-admin/login")
  } else {
    // Fallback: if no context or unknown context, redirect to root.
    // Middleware will then handle further redirection.
    // On main domain, / -> /admin/login
    // On subdomain, / -> /student/login (this is the less ideal fallback for subdomains if context is missing)
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
