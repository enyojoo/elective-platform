import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const subdomain = params.subdomain

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 })
  }

  try {
    // Query the database for the institution with this subdomain
    const { data, error } = await supabase.from("institutions").select("id").eq("subdomain", subdomain).single()

    if (error && error.code === "PGRST116") {
      // No results found, subdomain is available
      return NextResponse.json({ exists: false, message: "Subdomain available" }, { status: 404 })
    } else if (data) {
      // Subdomain exists
      return NextResponse.json({ exists: true, message: "Subdomain already in use" })
    } else {
      console.error("API: Error fetching institution by subdomain:", error)
      return NextResponse.json({ error: "Error checking subdomain" }, { status: 500 })
    }
  } catch (error) {
    console.error("API: Unexpected error in subdomain check:", error)
    return NextResponse.json({ error: "Error checking subdomain" }, { status: 500 })
  }
}
