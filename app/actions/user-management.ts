"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { UserRole } from "@/lib/types"
import { revalidatePath } from "next/cache"

// Get all users for an institution
export async function getUsers(institutionId: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    // Get all profiles for this institution
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        created_at,
        student_profiles(
          enrollment_year,
          group_id,
          groups(id, name, program_id, programs(id, name, degree_id, degrees(id, name, code)))
        ),
        manager_profiles(
          program_id,
          programs(id, name, degree_id, degrees(id, name, code))
        )
      `)
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return { error: "Failed to fetch users" }
    }

    // Transform the data to include degree and program information
    const users = profiles.map((profile) => {
      let degreeId = null
      let programId = null
      let enrollmentYear = null
      const status = "active" // Default status

      if (profile.role === UserRole.STUDENT && profile.student_profiles?.length > 0) {
        const studentProfile = profile.student_profiles[0]
        enrollmentYear = studentProfile.enrollment_year

        if (studentProfile.groups) {
          const group = studentProfile.groups
          programId = group.program_id

          if (group.programs) {
            degreeId = group.programs.degree_id
          }
        }
      } else if (profile.role === UserRole.PROGRAM_MANAGER && profile.manager_profiles?.length > 0) {
        const managerProfile = profile.manager_profiles[0]
        programId = managerProfile.program_id

        if (managerProfile.programs) {
          degreeId = managerProfile.programs.degree_id
        }
      }

      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        degreeId,
        programId,
        enrollmentYear,
        status,
        createdAt: profile.created_at,
      }
    })

    return { users }
  } catch (error) {
    console.error("Error in getUsers:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get all degrees for an institution
export async function getDegrees(institutionId: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data, error } = await supabase
      .from("degrees")
      .select("id, name, code")
      .eq("institution_id", institutionId)
      .order("name")

    if (error) {
      console.error("Error fetching degrees:", error)
      return { error: "Failed to fetch degrees" }
    }

    return { degrees: data }
  } catch (error) {
    console.error("Error in getDegrees:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get all programs for an institution
export async function getPrograms(institutionId: string, degreeId?: number) {
  const supabase = createServerActionClient({ cookies })

  try {
    let query = supabase
      .from("programs")
      .select("id, name, code, degree_id")
      .eq("institution_id", institutionId)
      .order("name")

    if (degreeId) {
      query = query.eq("degree_id", degreeId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching programs:", error)
      return { error: "Failed to fetch programs" }
    }

    return { programs: data }
  } catch (error) {
    console.error("Error in getPrograms:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Get all groups for a program
export async function getGroups(programId: number) {
  const supabase = createServerActionClient({ cookies })

  try {
    const { data, error } = await supabase.from("groups").select("id, name").eq("program_id", programId).order("name")

    if (error) {
      console.error("Error fetching groups:", error)
      return { error: "Failed to fetch groups" }
    }

    return { groups: data }
  } catch (error) {
    console.error("Error in getGroups:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Invite a manager
export async function inviteManager(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  try {
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const degreeId = Number.parseInt(formData.get("degreeId") as string)
    const programId = Number.parseInt(formData.get("programId") as string)
    const enrollmentYear = formData.get("enrollmentYear") as string
    const sendInvitation = formData.get("sendInvitation") === "true"
    const institutionId = formData.get("institutionId") as string

    // Generate a random password for the user
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      console.error("Error creating user:", authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Failed to create user" }
    }

    // Create profile record
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: name,
      email,
      role: UserRole.PROGRAM_MANAGER,
      institution_id: institutionId,
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      return { error: "Failed to create user profile" }
    }

    // Create manager profile record
    const { error: managerError } = await supabase.from("manager_profiles").insert({
      profile_id: authData.user.id,
      program_id: programId,
    })

    if (managerError) {
      console.error("Error creating manager profile:", managerError)
      return { error: "Failed to create manager profile" }
    }

    // Send invitation email if requested
    if (sendInvitation) {
      // In a real app, you would send an email here
      // For now, we'll just log it
      console.log(`Invitation would be sent to ${email} with password ${password}`)
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error in inviteManager:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Invite a student
export async function inviteStudent(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  try {
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const degreeId = Number.parseInt(formData.get("degreeId") as string)
    const programId = Number.parseInt(formData.get("programId") as string)
    const groupId = Number.parseInt(formData.get("groupId") as string)
    const enrollmentYear = formData.get("enrollmentYear") as string
    const sendInvitation = formData.get("sendInvitation") === "true"
    const institutionId = formData.get("institutionId") as string

    // Generate a random password for the user
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (authError) {
      console.error("Error creating user:", authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Failed to create user" }
    }

    // Create profile record
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: name,
      email,
      role: UserRole.STUDENT,
      institution_id: institutionId,
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      return { error: "Failed to create user profile" }
    }

    // Create student profile record
    const { error: studentError } = await supabase.from("student_profiles").insert({
      profile_id: authData.user.id,
      group_id: groupId,
      enrollment_year: enrollmentYear,
    })

    if (studentError) {
      console.error("Error creating student profile:", studentError)
      return { error: "Failed to create student profile" }
    }

    // Send invitation email if requested
    if (sendInvitation) {
      // In a real app, you would send an email here
      // For now, we'll just log it
      console.log(`Invitation would be sent to ${email} with password ${password}`)
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error in inviteStudent:", error)
    return { error: "An unexpected error occurred" }
  }
}
