import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const { subdomain } = params

  console.log(`API: Checking subdomain validity: ${subdomain}`)

  if (!subdomain || subdomain.trim() === "") {
    console.log("API: Invalid subdomain request - empty or null")
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  try {
    // Query the database for the institution with this subdomain
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, primary_color, favicon_url")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`API: Error checking subdomain ${subdomain}:`, error.message)
      return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
    }

    const result = {
      exists: !!data,
      institution: data || null,
    }

    console.log(`API: Subdomain ${subdomain} validity result:`, result.exists)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`API: Unexpected error checking subdomain ${subdomain}:`, error)
    return NextResponse.json({ exists: false, error: "Server error" }, { status: 500 })
  }
}
