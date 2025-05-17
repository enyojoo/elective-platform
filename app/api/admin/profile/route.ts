import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*, degrees(*), groups(*)")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)

      // If no rows returned, try without any joins
      if (error.message.includes("no rows returned")) {
        const { data: basicData, error: basicError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (basicError) {
          return NextResponse.json({ error: basicError.message }, { status: 500 })
        }

        return NextResponse.json(basicData)
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
