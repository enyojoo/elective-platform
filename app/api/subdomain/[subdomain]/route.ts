import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  console.log(`API: Validating subdomain: ${subdomain}`)

  try {
    // Query the database for the institution with this subdomain
    const { data, error } = await supabase
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

    if (!data) {
      // Subdomain is available (not found in database)
      return NextResponse.json({ exists: false, message: "Subdomain available" }, { status: 404 })
    }

    // Subdomain exists and is in use
    const institution = {
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      logo_url: data.logo_url,
      favicon_url: data.favicon_url,
      primary_color: data.primary_color,
    }

    console.log(`API: Subdomain validation result:`, { exists: !!institution, institution })
    return NextResponse.json({
      exists: true,
      institution: {
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        primary_color: data.primary_color,
      },
    })
  } catch (error) {
    console.error(`API: Error validating subdomain ${subdomain}:`, error)
    return NextResponse.json({ exists: false, error: "Internal server error" }, { status: 500 })
  }
}
