import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  try {
    // Query the database for the institution with this subdomain
    const { data: institution, error } = await supabase
      .from("institutions")
      .select("id, name, subdomain, is_active, logo_url, favicon_url, primary_color")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      // Check if it's a "not found" error (PGRST116)
      if (error.code === "PGRST116") {
        // Subdomain is available (not found in database)
        return NextResponse.json({ exists: false, message: "Subdomain available" }, { status: 404 })
      }

      console.error("API: Error fetching institution by subdomain:", error)
      return NextResponse.json({ error: "Error checking subdomain" }, { status: 500 })
    }

    if (!institution) {
      // Subdomain is available (not found in database)
      return NextResponse.json({ exists: false, message: "Subdomain available" }, { status: 404 })
    }

    // Ensure we return all necessary institution data
    return NextResponse.json({
      exists: true,
      institution: {
        id: institution.id,
        name: institution.name,
        subdomain: institution.subdomain,
        primary_color: institution.primary_color,
        favicon_url: institution.favicon_url,
        logo_url: institution.logo_url,
        is_active: institution.is_active,
      },
    })
  } catch (error) {
    console.error("API: Unexpected error in subdomain check:", error)
    return NextResponse.json({ error: "Error checking subdomain" }, { status: 500 })
  }
}
