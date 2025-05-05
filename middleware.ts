import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  // Get hostname for multi-tenancy
  const hostname = req.headers.get("host") || ""
  console.log(`Processing request for hostname: ${hostname}`)

  const isSubdomain =
    hostname.includes(".electivepro.net") &&
    !hostname.startsWith("www") &&
    !hostname.startsWith("app") &&
    !hostname.startsWith("api")

  // Handle subdomain routing
  if (isSubdomain) {
    const subdomain = hostname.split(".")[0]
    console.log(`Detected subdomain: ${subdomain}`)

    try {
      // SIMPLIFIED APPROACH: Just query the institutions table directly
      // This is more reliable than using RPC functions
      const { data: institutions, error } = await supabase
        .from("institutions")
        .select("id, name, subdomain")
        .eq("subdomain", subdomain)
        .eq("is_active", true)

      console.log("Query result:", { data: institutions, error })

      if (error) {
        console.error("Database error:", error.message)
        return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
      }

      if (!institutions || institutions.length === 0) {
        console.log(`No active institution found for subdomain: ${subdomain}`)
        return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
      }

      const institution = institutions[0]
      console.log(`Found institution: ${institution.name} (${institution.id})`)

      // Valid subdomain - allow access and add institution info to headers
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set("x-electivepro-subdomain", subdomain)
      requestHeaders.set("x-institution-id", institution.id)

      // IMPORTANT: Return next response with the updated headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (err) {
      console.error("Error in middleware:", err)
      return NextResponse.redirect(new URL("https://app.electivepro.net", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
