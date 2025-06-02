import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Check-role API: Authorization header missing or invalid")
    return NextResponse.json({ error: "Authorization header missing or invalid" }, { status: 401 })
  }

  const token = authHeader.split(" ")[1]

  // Create a temporary Supabase client instance to validate the token and get user
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    console.error("Check-role API: Invalid token or error fetching user.", userError)
    return NextResponse.json({ error: "Invalid or expired token. Please log in again." }, { status: 401 })
  }

  const userId = user.id
  console.log("Check-role API: Token validated for user ID:", userId)

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, institution_id") // Ensure institution_id is selected
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error(`Check-role API: Profile fetch error for userId '${userId}'.`, profileError)
      if (profileError.code === "PGRST116") {
        // Not found
        return NextResponse.json({ error: "User profile not found. Please contact support." }, { status: 404 })
      }
      return NextResponse.json({ error: "Error fetching user profile. Please try again." }, { status: 500 })
    }

    if (!profile) {
      console.error(`Check-role API: No profile found for userId '${userId}'.`)
      return NextResponse.json({ error: "User profile not found. Please contact support." }, { status: 404 })
    }

    console.log(`Check-role API: Profile found for userId '${userId}':`, {
      role: profile.role,
      institutionId: profile.institution_id,
    })
    return NextResponse.json({ role: profile.role, institutionId: profile.institution_id })
  } catch (err: any) {
    console.error(`Check-role API: Unexpected error for userId '${userId}'.`, err)
    return NextResponse.json({ error: err.message || "An unexpected server error occurred." }, { status: 500 })
  }
}
