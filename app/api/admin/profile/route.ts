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

    // Use supabaseAdmin to bypass RLS
    const { data: profile, error } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching admin profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Unexpected error in admin profile API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

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

    // Update profile using admin client to bypass RLS
    const { data: profile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: body.full_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update email in auth if it changed
    if (body.email && body.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: body.email,
      })

      if (authError) {
        console.error("Error updating email:", authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Unexpected error in profile update API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
