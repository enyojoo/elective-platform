import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"

export async function getInstitutionFromRequest(req: NextRequest) {
  const subdomain = req.headers.get("x-electivepro-subdomain")

  if (!subdomain) {
    return null
  }

  const { data } = await supabase
    .from("institutions")
    .select("id, name, subdomain")
    .eq("subdomain", subdomain)
    .eq("is_active", true)
    .single()

  return data
}

export async function getUserFromRequest(req: NextRequest) {
  const supabaseServerClient = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabaseServerClient.auth.getSession()

  if (!session?.user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, institution_id, role")
    .eq("id", session.user.id)
    .single()

  return { user: session.user, profile }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 })
}
