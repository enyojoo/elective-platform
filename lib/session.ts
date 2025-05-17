"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error:", error)
    return null
  }
}
