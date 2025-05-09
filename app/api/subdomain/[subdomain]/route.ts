import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  try {
    // Query the database for the institution with this subdomain
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, subdomain, is_active, logo_url, favicon_url, primary_color")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      console.error("API: Error fetching institution by subdomain:", error)
      return NextResponse.json({ exists: false, message: "Institution not found" }, { status: 404 })
    }

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
    console.error("API: Unexpected error in subdomain check:", error)
    return NextResponse.json({ exists: false, message: "Error checking subdomain" }, { status: 500 })
  }
}
