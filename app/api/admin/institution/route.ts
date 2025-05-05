import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the user's institution_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institution_id")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile.institution_id) {
      return NextResponse.json({ error: "No institution associated with this user" }, { status: 404 })
    }

    // Get the institution details
    const { data: institution, error: institutionError } = await supabaseAdmin
      .from("institutions")
      .select("*")
      .eq("id", profile.institution_id)
      .single()

    if (institutionError) {
      console.error("Error fetching institution:", institutionError)
      return NextResponse.json({ error: institutionError.message }, { status: 500 })
    }

    return NextResponse.json({ institution })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()

    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the user's institution_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("institution_id, role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile.institution_id) {
      return NextResponse.json({ error: "No institution associated with this user" }, { status: 404 })
    }

    // Verify user is an admin
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can update institution settings" }, { status: 403 })
    }

    // Update the institution
    const { error: updateError } = await supabaseAdmin
      .from("institutions")
      .update(updates)
      .eq("id", profile.institution_id)

    if (updateError) {
      console.error("Error updating institution:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
