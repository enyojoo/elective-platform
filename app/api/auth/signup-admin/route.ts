import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { institutionName, subdomain, adminEmail, adminPassword, fullName } = await request.json()

    // Validate inputs
    if (!institutionName || !subdomain || !adminEmail || !adminPassword || !fullName) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate subdomain format
    if (!/^[a-z0-9]+$/.test(subdomain)) {
      return NextResponse.json({ error: "Invalid subdomain format" }, { status: 400 })
    }

    // Check if subdomain is available
    const { data: existingInstitution, error: checkError } = await supabaseAdmin
      .from("institutions")
      .select("id")
      .eq("subdomain", subdomain)
      .single()

    if (existingInstitution) {
      return NextResponse.json({ error: "Subdomain is already taken" }, { status: 400 })
    }

    // Create the institution
    const { data: institution, error: institutionError } = await supabaseAdmin
      .from("institutions")
      .insert({
        name: institutionName,
        subdomain: subdomain,
        is_active: true,
        subscription_plan: "basic",
        subscription_status: "active",
      })
      .select()
      .single()

    if (institutionError) {
      console.error("Institution creation error:", institutionError)
      return NextResponse.json({ error: "Failed to create institution" }, { status: 500 })
    }

    // Create the admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Create admin profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      institution_id: institution.id,
      full_name: fullName,
      role: "admin",
      email: adminEmail,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: "Failed to create admin profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in signup-admin API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
