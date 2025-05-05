import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function getInstitutionFromRequest(req: NextRequest) {
  const subdomain = req.headers.get("x-electivepro-subdomain")

  if (!subdomain) {
    return null
  }

  try {
    // First try with admin client for better error handling
    const { data, error } = await supabaseAdmin
      .from("institutions")
      .select("id, name, subdomain, logo_url, primary_color")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`Error fetching institution with subdomain ${subdomain}:`, error.message)
      return null
    }

    return data
  } catch (error) {
    console.error(`Unexpected error fetching institution with subdomain ${subdomain}:`, error)
    return null
  }
}

export async function getUserFromRequest(req: NextRequest) {
  try {
    const supabaseServerClient = createServerComponentClient({ cookies })
    const {
      data: { session },
      error: sessionError,
    } = await supabaseServerClient.auth.getSession()

    if (sessionError) {
      console.error("Error getting session:", sessionError.message)
      return null
    }

    if (!session?.user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, institution_id, role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error(`Error fetching profile for user ${session.user.id}:`, profileError.message)
      return null
    }

    return { user: session.user, profile }
  } catch (error) {
    console.error("Unexpected error in getUserFromRequest:", error)
    return null
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 })
}

// New utility function to safely fetch institutions
export async function fetchInstitutions(options = {}) {
  try {
    const { data, error } = await supabaseAdmin.from("institutions").select("*")

    if (error) {
      console.error("Error fetching institutions:", error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Unexpected error fetching institutions:", error)
    return { data: null, error }
  }
}

// New utility function to safely fetch a single institution
export async function fetchInstitution(id) {
  try {
    const { data, error } = await supabaseAdmin.from("institutions").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching institution ${id}:`, error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error(`Unexpected error fetching institution ${id}:`, error)
    return { data: null, error }
  }
}
