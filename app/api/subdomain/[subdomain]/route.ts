import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// CRITICAL FIX: Add memory cache to prevent database overload
const subdomainCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: Request, { params }: { params: { subdomain: string } }) {
  const { subdomain } = params

  console.log(`API: Checking subdomain validity: ${subdomain}`)

  if (!subdomain || subdomain.trim() === "") {
    console.log("API: Invalid subdomain request - empty or null")
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  try {
    // CRITICAL FIX: Check in-memory cache first
    const now = Date.now()
    const cachedResult = subdomainCache.get(subdomain)

    if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
      console.log(`API: Using in-memory cached result for subdomain: ${subdomain}`)
      return NextResponse.json(cachedResult.data)
    }

    // Query the database for the institution with this subdomain
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, primary_color, favicon_url, subdomain, is_active")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    // CRITICAL FIX: Better error handling
    if (error) {
      // If it's a "not found" error, return exists: false
      if (error.code === "PGRST116") {
        console.log(`API: Subdomain ${subdomain} not found in database`)
        const result = { exists: false, message: "Subdomain not found" }

        // Cache the negative result
        subdomainCache.set(subdomain, { data: result, timestamp: now })

        return NextResponse.json(result)
      }

      // For other errors, log but don't cache, and return a 500
      console.error(`API: Error checking subdomain ${subdomain}:`, error.message)
      return NextResponse.json({ exists: false, error: error.message }, { status: 500 })
    }

    // CRITICAL FIX: Double check the data
    if (!data || !data.is_active) {
      console.log(`API: Subdomain ${subdomain} exists but is not active`)
      const result = { exists: false, message: "Subdomain not active" }

      // Cache the negative result
      subdomainCache.set(subdomain, { data: result, timestamp: now })

      return NextResponse.json(result)
    }

    // Valid subdomain found
    const result = {
      exists: true,
      institution: {
        id: data.id,
        name: data.name,
        subdomain: data.subdomain,
        primary_color: data.primary_color,
        favicon_url: data.favicon_url,
      },
    }

    // Cache the positive result
    subdomainCache.set(subdomain, { data: result, timestamp: now })

    console.log(`API: Subdomain ${subdomain} validity result: valid`)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`API: Unexpected error checking subdomain ${subdomain}:`, error)
    return NextResponse.json({ exists: false, error: "Server error" }, { status: 500 })
  }
}
