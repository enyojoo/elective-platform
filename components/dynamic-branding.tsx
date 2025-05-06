"use client"

import { useInstitution } from "@/lib/institution-context"
import { useEffect } from "react"
import Head from "next/head"

export function DynamicBranding() {
  const { institution } = useInstitution()

  useEffect(() => {
    if (institution) {
      // Apply primary color to CSS variables
      if (institution.primary_color) {
        document.documentElement.style.setProperty("--primary", institution.primary_color)
      }

      // Apply secondary color if available
      if (institution.secondary_color) {
        document.documentElement.style.setProperty("--secondary", institution.secondary_color)
      }
    }
  }, [institution])

  if (!institution) return null

  return (
    <>
      {institution.favicon_url && (
        <Head>
          <link rel="icon" href={institution.favicon_url} />
          <link rel="shortcut icon" href={institution.favicon_url} />
          <link rel="apple-touch-icon" href={institution.favicon_url} />
        </Head>
      )}
      {/* Additional meta tags can be added here */}
    </>
  )
}
