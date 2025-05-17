import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (error || !profile) {
    console.error("Error fetching user profile:", error)
    redirect("/auth/signin")
  }

  return profile
}
