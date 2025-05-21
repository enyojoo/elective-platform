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
    // First try to get from cache to speed up response
    const cacheKey = `subdomain:${subdomain}`
    const cachedResult = sessionStorage?.getItem(cacheKey)

    if (cachedResult) {
      console.log(`API: Using cached result for subdomain: ${subdomain}`)
      return NextResponse.json(JSON.parse(cachedResult))
    }

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

    // Cache the result for 5 minutes
    try {
      sessionStorage?.setItem(cacheKey, JSON.stringify(result))
    } catch (e) {
      console.error("API: Error caching subdomain result:", e)
    }

    console.log(`API: Subdomain ${subdomain} validity result:`, result.exists)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`API: Unexpected error checking subdomain ${subdomain}:`, error)
    return NextResponse.json({ exists: false, error: "Server error" }, { status: 500 })
  }
}
