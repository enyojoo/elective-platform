"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"

interface SupabaseContextType {
  supabase: any // Replace 'any' with the actual type from supabase-js if available
  session: Session | null
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createClientComponentClient())
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    async function getInitialSession() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      setSession(session)
    }

    getInitialSession()

    supabaseClient.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })
  }, [supabaseClient])

  return <SupabaseContext.Provider value={{ supabase: supabaseClient, session }}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
