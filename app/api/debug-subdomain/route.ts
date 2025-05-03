import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getSubdomain } from "@/lib/subdomain-utils"

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const hostname = req.headers.get("host") || ""
  const subdomain = getSubdomain(hostname)
  const xSubdomain = req.headers.get("x-electivepro-subdomain")

  let institution = null
  if (subdomain) {
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, subdomain, logo_url, primary_color")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single()

    if (data) {
      institution = data
    }
  }

  return NextResponse.json({
    hostname,
    detectedSubdomain: subdomain,
    middlewareSubdomain: xSubdomain,
    institution,
    env: {
      nodeEnv: process.env.NODE_ENV,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  })
}
