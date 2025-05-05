import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export async function GET() {
  try {
    // Get the current user from the auth cookie
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // First get the user's institution_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institution_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching admin profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile.institution_id) {
      return NextResponse.json({ error: "No institution associated with this admin" }, { status: 404 })
    }

    // Now get the institution data
    const { data: institution, error: institutionError } = await supabaseAdmin
      .from("institutions")
      .select("*")
      .eq("id", profile.institution_id)
      .single()

    if (institutionError) {
      console.error("Error fetching institution:", institutionError)
      return NextResponse.json({ error: institutionError.message }, { status: 500 })
    }

    return NextResponse.json(institution)
  } catch (error) {
    console.error("Unexpected error in institution API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Handle PUT requests to update institution
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Get the current user from the auth cookie
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // First get the user's institution_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institution_id, role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching admin profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile.institution_id) {
      return NextResponse.json({ error: "No institution associated with this admin" }, { status: 404 })
    }

    // Verify the user is an admin
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can update institution settings" }, { status: 403 })
    }

    // Update the institution
    const { data: institution, error: updateError } = await supabaseAdmin
      .from("institutions")
      .update({
        name: body.name,
        subdomain: body.subdomain,
        logo_url: body.logo_url,
        favicon_url: body.favicon_url,
        primary_color: body.primary_color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.institution_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating institution:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(institution)
  } catch (error) {
    console.error("Unexpected error in institution update API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
