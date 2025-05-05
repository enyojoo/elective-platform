import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"
import { unauthorized, serverError } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    // Verify the user is a super admin
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return unauthorized()
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || profile?.role !== "super_admin") {
      return unauthorized()
    }

    // Fetch institutions using the admin client
    const { data, error } = await supabaseAdmin
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching institutions:", error.message)
      return serverError(error.message)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected error in institutions API:", error)
    return serverError("An unexpected error occurred")
  }
}
