"use server"

import { cookies } from "next/headers"
// If you are using @supabase/ssr for everything:
// import { createServerClient } from "@supabase/ssr"
// Otherwise, for auth-helpers-nextjs:
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase" // Your admin client

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // For server actions with @supabase/auth-helpers-nextjs:
  const supabase = createServerActionClient({ cookies })
  // If using @supabase/ssr for actions:
  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   { cookies: { getAll: () => cookies().getAll(), set: (opts) => cookies().set(opts) /* ... other handlers */ } }
  // );

  const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    console.error("Auth Action - signIn Error:", signInError.message)
    return { error: signInError.message }
  }

  if (!signInData || !signInData.user) {
    console.error("Auth Action - signIn Error: No user data returned after successful sign-in.")
    return { error: "Sign-in failed, no user data." }
  }

  try {
    const user = signInData.user

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Auth Action - Profile fetch error:", profileError)
      await supabase.auth.signOut() // Clean up partial session
      return { error: "Error fetching user profile after login." }
    }

    if (profile && profile.role) {
      console.log(`Auth Action - Sign-in success for ${email}, role: ${profile.role}. Redirecting...`)
      switch (profile.role) {
        case "student":
          redirect("/student/dashboard")
        case "program_manager":
          redirect("/manager/dashboard")
        case "admin":
          redirect("/admin/dashboard") // <<--- This is our target
        case "super_admin":
          redirect("/super-admin/dashboard")
        default:
          console.warn(`Auth Action - Unknown role '${profile.role}' for user ${user.id}. Signing out.`)
          await supabase.auth.signOut()
          redirect("/") // Or a specific error/info page
      }
    } else {
      console.error(`Auth Action - Profile not found or role missing for user: ${user.id}`)
      await supabase.auth.signOut()
      return { error: "User profile not found or role is missing." }
    }
  } catch (err) {
    console.error("Auth Action - Error in signIn post-authentication logic:", err)
    await supabase.auth.signOut()
    return { error: "An unexpected error occurred during login processing." }
  }
  // Fallback, should not be reached if redirects are working
  return { error: "Login process did not result in a redirect." }
}

export async function signOut() {
  // For server actions with @supabase/auth-helpers-nextjs:
  const supabase = createServerActionClient({ cookies })
  // If using @supabase/ssr for actions, adjust client creation as above.

  await supabase.auth.signOut()
  console.log("Auth Action - signOut successful. Redirecting to /")
  redirect("/") // Middleware will then route to the appropriate login page
}

// ensureUserProfile and signUp actions remain as they were, assuming they use createServerActionClient correctly.
// ... (ensureUserProfile and signUp functions from your existing code)
// Update the ensureUserProfile function to use supabaseAdmin for profile checks
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
        // Potentially delete the auth user if profile creation fails to avoid orphaned auth users
        // await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
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
