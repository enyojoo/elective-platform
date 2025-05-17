import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Improve error handling in the subdomain validation API

// Add better error handling and logging:
export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const { subdomain } = params

  console.log(`API: Validating subdomain: ${subdomain}`)

  if (!subdomain) {
    console.log("API: No subdomain provided")
    return NextResponse.json({ exists: false }, { status: 404 })
  }

  try {
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, favicon_url, primary_color")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`API: Error fetching institution for subdomain ${subdomain}:`, error.message)

      // For database errors, return a 500 status
      return NextResponse.json({ exists: false, error: "Database error" }, { status: 500 })
    }

    if (!data) {
      console.log(`API: No institution found for subdomain ${subdomain}`)
      return NextResponse.json({ exists: false }, { status: 404 })
    }

    console.log(`API: Valid institution found for subdomain ${subdomain}`)
    return NextResponse.json({
      exists: true,
      institution: data,
    })
  } catch (error) {
    console.error(`API: Unexpected error validating subdomain ${subdomain}:`, error)

    // For unexpected errors, return a 500 status
    return NextResponse.json({ exists: false, error: "Unexpected error" }, { status: 500 })
  }
}
