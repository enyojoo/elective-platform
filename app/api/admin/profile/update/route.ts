import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    // Get the current user from the session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Use supabaseAdmin to bypass RLS
    const { error } = await supabaseAdmin.from("profiles").update({ full_name: name, email }).eq("id", user.id)

    if (error) {
      console.error("Error updating admin profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update auth email if it changed
    if (email && email !== user.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email })

      if (authError) {
        console.error("Error updating auth email:", authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
