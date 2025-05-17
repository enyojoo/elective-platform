import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain

  console.log(`API: Validating subdomain: ${subdomain}`)

  if (!subdomain) {
    console.log("API: No subdomain provided")
    return NextResponse.json({ exists: false, error: "Subdomain is required" }, { status: 400 })
  }

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
        console.log(`API: Subdomain ${subdomain} not found in database`)
        return NextResponse.json({ exists: false, message: "Subdomain available" }, { status: 404 })
      }

      console.error("API: Error fetching institution by subdomain:", error)
      return NextResponse.json({ error: "Error checking subdomain", details: error.message }, { status: 500 })
    }

    if (!data) {
      // Subdomain is available (not found in database)
      console.log(`API: No data returned for subdomain ${subdomain}`)
      return NextResponse.json({ exists: false, message: "Subdomain available" }, { status: 404 })
    }

    // Subdomain exists and is in use
    console.log(`API: Subdomain ${subdomain} exists and is active`)
    return NextResponse.json({
      exists: true,
      institution: {
        id: data.id || "unknown",
        name: data.name || "Unknown Institution",
        subdomain: data.subdomain,
        logo_url: data.logo_url || null,
        favicon_url: data.favicon_url || null,
        primary_color: data.primary_color || null,
      },
    })
  } catch (error) {
    console.error("API: Unexpected error in subdomain check:", error)
    return NextResponse.json({ error: "Error checking subdomain", details: error.message }, { status: 500 })
  }
}
